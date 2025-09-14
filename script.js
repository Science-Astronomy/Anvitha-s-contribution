// Sample flight data
const SAMPLE_FLIGHTS = [
  { callsign:'UAL102', from:'JFK', to:'LHR', lat1:40.6413, lon1:-73.7781, lat2:51.47, lon2:-0.4543, passengers:200 },
  { callsign:'DL456', from:'ATL', to:'LAX', lat1:33.6407, lon1:-84.4277, lat2:33.9416, lon2:-118.4085, passengers:150 },
  { callsign:'SWA701', from:'LAX', to:'SFO', lat1:33.9416, lon1:-118.4085, lat2:37.6213, lon2:-122.3790, passengers:160 }
];

const EMISSION_FACTOR = 0.11; // kg CO₂ / pax-km

function haversineKm(lat1, lon1, lat2, lon2){
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function estimate(flight){
  const dist = haversineKm(flight.lat1, flight.lon1, flight.lat2, flight.lon2);
  const perPax = dist*EMISSION_FACTOR;
  const total = perPax*(flight.passengers||150);
  return {distance:Math.round(dist), total:Math.round(total)};
}

// Map setup
const map = L.map('map').setView([20,0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
const flightLayer = L.layerGroup().addTo(map);

// Chart
const ctx = document.getElementById('emChart');
const chart = new Chart(ctx, {
  type:'bar',
  data:{labels:[],datasets:[{label:'kg CO₂',data:[],backgroundColor:'#60a5fa'}]}
});

// Render flights
function renderFlights(flights){
  flightLayer.clearLayers();
  let totals=0;

  flights.forEach(f=>{
    const e = estimate(f);
    totals += e.total;
    // draw line
    L.polyline([[f.lat1,f.lon1],[f.lat2,f.lon2]], {color:'#2dd4bf'}).addTo(flightLayer)
      .bindPopup(`${f.callsign} ${f.from}→${f.to}<br>${e.distance} km<br>${e.total} kg CO₂`);
  });

  document.getElementById('totalEmissions').textContent = totals;
  document.getElementById('avgEmission').textContent = Math.round(totals/flights.length);
  document.getElementById('flightCount').textContent = flights.length;
  document.getElementById('updatedAt').textContent = new Date().toLocaleTimeString();

  // update chart
  chart.data.labels = flights.map(f=>f.callsign);
  chart.data.datasets[0].data = flights.map(f=>estimate(f).total);
  chart.update();
}

// Initial load
renderFlights(SAMPLE_FLIGHTS);

// Refresh button just re-renders for demo
document.getElementById('refreshBtn').addEventListener('click',()=>renderFlights(SAMPLE_FLIGHTS));
