// ===== Chart setup =====
const co2Chart = new Chart(document.getElementById("co2Chart"), {
  type: "bar",
  data: {
    labels: monthly.labels,
    datasets: [{
      label: "CO₂ (kg)",
      data: monthly.co2kg,
      borderRadius: 10
    }]
  },
  options: {
    plugins: {
      legend: { display: false }
    }
  }
});

function updateChart() {
  // simple version: add new flight's CO₂ to the last month
  co2Chart.data.datasets[0].data[
    co2Chart.data.datasets[0].data.length - 1
  ] += recent[0].co2kg;

  co2Chart.update();
}
