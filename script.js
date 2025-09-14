// ========================= Config & helpers ============================
const OPEN_SKY_URL = "https://opensky-network.org/api/states/all";

// If your browser hits CORS issues, set this to true.
// (Public proxies can be flaky; best is hosting via a backend you control.)
const USE_CORS_PROXY = false;
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

const EMISSION_FACTOR = 0.11; // kg CO₂ per passenger-km
const ASSUMED_PAX = 150; // simplistic assumption for instantaneous rate

const fmtInt = (n) => Number(n ?? 0).toLocaleString(undefined);
const kmh = (ms) => (ms ?? 0) * 3.6;
const feet = (m) => (m ?? 0) * 3.28084;

// great-circle destination given start, bearing, and distance
function projectPoint(lat, lon, bearingDeg, distanceKm) {
  const R = 6371;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;
  const θ = (bearingDeg * Math.PI) / 180;
  const δ = distanceKm / R;

  const sinφ2 =
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
  const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return {
    lat: (φ2 * 180) / Math.PI,
    lon: (((λ2 * 180) / Math.PI + 540) % 360) - 180,
  };
}

// ========================= Map & chart ================================
const map = L.map("map").setView([20, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
}).addTo(map);
const flightLayer = L.layerGroup().addTo(map);

const chart = new Chart(document.getElementById("emChart"), {
  type: "bar",
  data: { labels: [], datasets: [{ label: "kg CO₂ / hour (est.)", data: [] }] },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#e6eef6" } },
      y: { ticks: { color: "#e6eef6" } },
    },
  },
});

// ========================= UI refs ===================================
const updatedEl = document.getElementById("updatedAt");
const countEl = document.getElementById("flightCount");
const avgVelEl = document.getElementById("avgVelocity");
const avgRateEl = document.getElementById("avgRate");
const topFlightsEl = document.getElementById("topFlights");
const refreshBtn = document.getElementById("refreshBtn");

// ========================= Fetch & normalize ==========================
async function fetchOpenSky() {
  const url = USE_CORS_PROXY
    ? CORS_PROXY + encodeURIComponent(OPEN_SKY_URL)
    : OPEN_SKY_URL;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`OpenSky error ${res.status}`);
  const data = await res.json();
  // data.states is an array of arrays:
  // [0] icao24, [1] callsign, [2] origin_country, [3] time_position, [4] last_contact,
  // [5] lon, [6] lat, [7] baro_altitude(m), [8] on_ground(bool), [9] velocity(m/s),
  // [10] true_track(deg), [11] vertical_rate(m/s), [12] sensors, [13] geo_altitude(m),
  // [14] squawk, [15] spi, [16] position_source
  const states = (data.states || [])
    .map((s) => ({
      icao24: s[0],
      callsign: (s[1] || "").trim() || s[0],
      origin: s[2],
      time_position: s[3],
      last_contact: s[4],
      lon: s[5],
      lat: s[6],
      baro_alt_m: s[7],
      on_ground: !!s[8],
      velocity_ms: s[9],
      track_deg: s[10],
      vert_rate_ms: s[11],
      geo_alt_m: s[13],
      squawk: s[14],
      spi: s[15],
      src: s[16],
    }))
    // filter out invalid coords
    .filter((f) => typeof f.lat === "number" && typeof f.lon === "number");

  return { time: data.time, flights: states };
}

// ========================= Rendering =================================
function makeFlightRow(f, rank) {
  const vKmh = kmh(f.velocity_ms);
  const ratePerHour = vKmh * EMISSION_FACTOR * ASSUMED_PAX; // kg/hour
  const div = document.createElement("div");
  div.className = "route-row";
  div.innerHTML = `
    <div>
      <strong>${rank}. ${f.callsign}</strong>
      <div class="chips">
        <span class="chip">${f.origin || "—"}</span>
        <span class="chip">Lat ${f.lat?.toFixed(2)}, Lon ${f.lon?.toFixed(
    2
  )}</span>
        <span class="chip">Vel ${vKmh.toFixed(0)} km/h</span>
        <span class="chip">Alt ${(
          feet(f.geo_alt_m) || feet(f.baro_alt_m)
        ).toFixed(0)} ft</span>
        <span class="chip">Track ${Math.round(f.track_deg ?? 0)}°</span>
      </div>
    </div>
    <strong>${fmtInt(Math.round(ratePerHour))} kg/h</strong>
  `;
  return div;
}

function renderFlights(flights) {
  flightLayer.clearLayers();

  // Draw marker + small heading polyline (50 km) if track present
  flights.forEach((f) => {
    const marker = L.circleMarker([f.lat, f.lon], {
      radius: 5,
      color: "#60a5fa",
      weight: 2,
    }).addTo(flightLayer);

    const vKmh = kmh(f.velocity_ms);
    const ratePerHour = vKmh * EMISSION_FACTOR * ASSUMED_PAX;

    let headingLine;
    if (typeof f.track_deg === "number") {
      const proj = projectPoint(f.lat, f.lon, f.track_deg, 50); // 50 km arrow
      headingLine = L.polyline(
        [
          [f.lat, f.lon],
          [proj.lat, proj.lon],
        ],
        { color: "#2dd4bf", weight: 3 }
      ).addTo(flightLayer);
    }

    const popupHtml = `
      <strong>${f.callsign}</strong> — ${f.origin || "—"}<br/>
      Pos: ${f.lat?.toFixed(4)}, ${f.lon?.toFixed(4)}<br/>
      Vel: ${vKmh.toFixed(0)} km/h &nbsp; Track: ${Math.round(
      f.track_deg ?? 0
    )}°<br/>
      Alt: ${(feet(f.geo_alt_m) || feet(f.baro_alt_m)).toFixed(0)} ft<br/>
      <strong>Est. CO₂ rate: ${fmtInt(Math.round(ratePerHour))} kg/h</strong>
    `;

    marker.bindPopup(popupHtml);
    if (headingLine) headingLine.bindPopup(popupHtml);

    const fit = () =>
      map.fitBounds(
        headingLine
          ? headingLine.getBounds()
          : L.latLngBounds([
              [f.lat, f.lon],
              [f.lat, f.lon],
            ]),
        { padding: [40, 40] }
      );
    marker.on("click", fit);
    if (headingLine) headingLine.on("click", fit);
  });

  // Stats
  const count = flights.length;
  const avgVel =
    count === 0
      ? 0
      : flights.reduce((a, f) => a + kmh(f.velocity_ms || 0), 0) / count;
  const avgRate = count === 0 ? 0 : avgVel * EMISSION_FACTOR * ASSUMED_PAX;

  countEl.textContent = fmtInt(count);
  avgVelEl.textContent = fmtInt(Math.round(avgVel));
  avgRateEl.textContent = fmtInt(Math.round(avgRate));
  updatedEl.textContent = new Date().toLocaleTimeString();

  // Leaderboard + chart (top 20 by rate)
  const ranked = flights
    .map((f) => ({
      ...f,
      rate: kmh(f.velocity_ms || 0) * EMISSION_FACTOR * ASSUMED_PAX,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 20);

  topFlightsEl.innerHTML = "";
  ranked
    .slice(0, 8)
    .forEach((f, i) => topFlightsEl.appendChild(makeFlightRow(f, i + 1)));

  chart.data.labels = ranked.map((f) => f.callsign);
  chart.data.datasets[0].data = ranked.map((f) => Math.round(f.rate));
  chart.update();
}

// ========================= Actions ===================================
async function loadAndRender() {
  try {
    const { flights } = await fetchOpenSky();
    renderFlights(flights);
  } catch (e) {
    console.error(e);
    alert(
      "Failed to load from OpenSky. If this is a CORS error, set USE_CORS_PROXY=true in script.js."
    );
  }
}

document.getElementById("refreshBtn").addEventListener("click", loadAndRender);

// initial load
loadAndRender();
