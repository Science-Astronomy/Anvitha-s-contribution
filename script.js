// ========== airline lookup =============
const AIRLINE_MAP = {
  UAL: "United Airlines",
  AIC: "Air India",
  DAL: "Delta Air Lines",
  AAL: "American Airlines",
  SWA: "Southwest Airlines",
  BAW: "British Airways",
  AFR: "Air France",
  KLM: "KLM Royal Dutch Airlines",
  SIA: "Singapore Airlines",
  ANA: "All Nippon Airways",
};

function airlineName(callsign) {
  if (!callsign) return "—";
  const prefix = callsign.trim().slice(0, 3).toUpperCase();
  return AIRLINE_MAP[prefix] || prefix;
}

// ========== config ==========
const OPEN_SKY_URL = "https://opensky-network.org/api/states/all";
const EMISSION_FACTOR = 0.11; // kg CO₂ per pax-km
const ASSUMED_PAX = 150;

const fmtInt = (n) => Number(n ?? 0).toLocaleString(undefined);
const kmh = (ms) => (ms ?? 0) * 3.6;
const feet = (m) => (m ?? 0) * 3.28084;

// ========== map/chart ==========
const map = L.map("map").setView([20, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
}).addTo(map);
const flightLayer = L.layerGroup().addTo(map);

const chart = new Chart(document.getElementById("emChart"), {
  type: "bar",
  data: { labels: [], datasets: [{ label: "kg CO₂ / h (est.)", data: [] }] },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#e6eef6" } },
      y: { ticks: { color: "#e6eef6" } },
    },
  },
});

// ========== ui refs ==========
const updatedEl = document.getElementById("updatedAt");
const countEl = document.getElementById("flightCount");
const avgVelEl = document.getElementById("avgVelocity");
const avgRateEl = document.getElementById("avgRate");
const topFlightsEl = document.getElementById("topFlights");
const refreshBtn = document.getElementById("refreshBtn");

// ========== fetch ==========
async function fetchOpenSky() {
  const res = await fetch(OPEN_SKY_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("OpenSky error " + res.status);
  const data = await res.json();
  const states = (data.states || []).map((s) => ({
    callsign: (s[1] || "").trim(),
    origin_country: s[2],
    lon: s[5],
    lat: s[6],
    baro_alt_m: s[7],
    velocity_ms: s[9],
    track_deg: s[10],
    geo_alt_m: s[13],
  }));
  return states.filter((f) => typeof f.lat === "number" && typeof f.lon === "number");
}

// ========== render ==========
function makeFlightRow(f, rank) {
  const vKmh = kmh(f.velocity_ms);
  const ratePerHour = vKmh * EMISSION_FACTOR * ASSUMED_PAX;
  const div = document.createElement("div");
  div.className = "route-row";
  div.innerHTML = `
    <div>
      <strong>${rank}. ${f.callsign || "—"}</strong><br/>
      Airline: ${airlineName(f.callsign)}<br/>
      Country: ${f.origin_country}
    </div>
    <strong>${fmtInt(Math.round(ratePerHour))} kg/h</strong>
  `;
  return div;
}

function renderFlights(flights) {
  flightLayer.clearLayers();

  flights.forEach((f) => {
    const marker = L.circleMarker([f.lat, f.lon], {
      radius: 5,
      color: "#60a5fa",
    }).addTo(flightLayer);

    const vKmh = kmh(f.velocity_ms);
    const ratePerHour = vKmh * EMISSION_FACTOR * ASSUMED_PAX;
    const alt = f.geo_alt_m || f.baro_alt_m;

    const popupHtml = `
      <strong>${f.callsign || "—"}</strong><br/>
      Airline: ${airlineName(f.callsign)}<br/>
      Country: ${f.origin_country}<br/>
      Velocity: ${vKmh.toFixed(0)} km/h<br/>
      Altitude: ${feet(alt).toFixed(0)} ft<br/>
      <strong>Est. CO₂: ${fmtInt(Math.round(ratePerHour))} kg/h</strong>
    `;
    marker.bindPopup(popupHtml);
  });

  // stats
  const count = flights.length;
  const avgVel = count ? flights.reduce((a, f) => a + kmh(f.velocity_ms || 0), 0) / count : 0;
  const avgRate = avgVel * EMISSION_FACTOR * ASSUMED_PAX;

  countEl.textContent = fmtInt(count);
  avgVelEl.textContent = fmtInt(Math.round(avgVel));
  avgRateEl.textContent = fmtInt(Math.round(avgRate));
  updatedEl.textContent = new Date().toLocaleTimeString();

  // leaderboard
  const ranked = flights
    .map((f) => ({
      ...f,
      rate: kmh(f.velocity_ms || 0) * EMISSION_FACTOR * ASSUMED_PAX,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10);

  topFlightsEl.innerHTML = "";
  ranked.forEach((f, i) => topFlightsEl.appendChild(makeFlightRow(f, i + 1)));

  // chart
  chart.data.labels = ranked.map((f) => f.callsign || airlineName(f.callsign));
  chart.data.datasets[0].data = ranked.map((f) => Math.round(f.rate));
  chart.update();
}

// ========== actions ==========
async function loadAndRender() {
  try {
    const flights = await fetchOpenSky();
    renderFlights(flights);
  } catch (e) {
    console.error(e);
    alert("Failed to load OpenSky data (CORS or network).");
  }
}

refreshBtn.addEventListener("click", loadAndRender);

// initial load
loadAndRender();
