// Initialize map
const map = L.map('map').setView([20, 0], 2);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// --- Dashboard Elements ---
const flightCountEl = document.getElementById("flightCount");
const totalCO2El = document.getElementById("totalCO2");
const avgCO2El = document.getElementById("avgCO2");

// Simple CO2 estimation function (hackathon-level)
function estimateCO2(altitudeMeters) {
  if (!altitudeMeters || altitudeMeters <= 0) return 50; 
  return Math.min(altitudeMeters / 10, 500); 
}

// Fetch flight data from OpenSky API
async function loadFlights() {
  try {
    const response = await fetch('https://opensky-network.org/api/states/all');
    const data = await response.json();

    // Clear old markers
    if (window.flightLayer) {
      map.removeLayer(window.flightLayer);
    }
    window.flightLayer = L.layerGroup().addTo(map);

    let totalFlights = 0;
    let totalCO2 = 0;

    // Loop through flights and add markers
    data.states.forEach(flight => {
      const callsign = flight[1]?.trim() || "N/A";
      const country = flight[2] || "Unknown";
      const lon = flight[5];
      const lat = flight[6];
      const alt = flight[7];

      if (lat && lon) {
        totalFlights++;
        const flightCO2 = estimateCO2(alt);
        totalCO2 += flightCO2;

        const marker = L.circleMarker([lat, lon], {
          radius: 4,
          color: "red"
        }).addTo(window.flightLayer);

        marker.bindPopup(`
          <b>Callsign:</b> ${callsign}<br>
          <b>Origin Country:</b> ${country}<br>
          <b>Lat:</b> ${lat.toFixed(2)}, <b>Lon:</b> ${lon.toFixed(2)}<br>
          <b>Altitude:</b> ${alt ? alt + " m" : "N/A"}<br>
          <b>Est. CO₂:</b> ${flightCO2.toFixed(1)} kg
        `);
      }
    });

    // --- Update Dashboard Stats ---
    flightCountEl.textContent = totalFlights;
    totalCO2El.textContent = (totalCO2 / 1000).toFixed(2); // tons
    avgCO2El.textContent = totalFlights > 0 ? (totalCO2 / totalFlights).toFixed(1) : 0;

  } catch (err) {
    console.error("Error fetching flight data:", err);
  }
}

// Load once, then refresh every 15s
loadFlights();
setInterval(loadFlights, 15000);
