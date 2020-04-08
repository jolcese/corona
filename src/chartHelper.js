import Chart from 'chart.js';

export function createChart(container, text, LOG_AXIS) {

  var scales;
  if (LOG_AXIS == "true") {
      scales = scalesLog;
  } else {
      scales = scalesLin;
  }

  const canvasChart = document.createElement('canvas');
  container.appendChild(canvasChart);

  return new Chart(canvasChart, {
    type: 'line',
    options: {
        legend:legend,
        responsive: true,
        title: {
            display: true,
            text: text
        },
        scales: scales
    }
});
}
// Add data into dataset
export function addDataToDataset(dataset, label, data) {
  dataset.push({
      label: toTitleCase(label),
      data: data,
      fill: false,
      lineTension: 0
  });
}

// Sort, prune to only # of countries and update graph
export function updateChart(chart, labels, dataset, numCharts) {
  dataset.sort(compareMaxArray);
  dataset = dataset.reverse();
  var datasetResult = dataset.slice(0, numCharts);
  datasetResult = setLineStyle(datasetResult, numCharts);
  chart.data = {
      labels: labels,
      datasets: datasetResult
  };
  chart.update();
}

export function updateChartScale(chart, isLog) {
    if ( isLog ) {
        chart.options.scales = scalesLog;
    } else {
        chart.options.scales = scalesLin;
    }
    chart.update();
}

function compareMaxArray(a, b) {
  let comparison = 0;
  if (parseInt(a.data[a.data.length-2]) > parseInt(b.data[b.data.length-2])) comparison = 1;
  if (parseInt(a.data[a.data.length-2]) < parseInt(b.data[b.data.length-2])) comparison = -1;
  return comparison;
}

export function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export function setLineStyle(dataset, numGraphs) {
  for (var i = 0; i < dataset.length ; i++) {
      dataset[i].borderColor = calcColor(0,numGraphs, numGraphs - i);
      dataset[i].backgroundColor = calcColor(0,numGraphs, numGraphs - i);
      dataset[i].pointStyle = pointStyle(i);
      dataset[i].pointRadius = 4;
  }
  return (dataset)
}

function calcColor(min, max, val)
{
    var minHue = 240, maxHue=0;
    var curPercent = (val - min) / (max-min);
    var colString = "hsl(" + ((curPercent * (maxHue-minHue) ) + minHue) + ",100%,50%)";
    return colString;
}

function pointStyle(index) {
    //   var styles = [ 'circle', 'cross', 'crossRot', 'dash', 'line', 'rect', 'rectRounded', 'rectRot', 'star', 'triangle']
    var styles = [ 'circle', 'cross', 'crossRot', 'rect', 'rectRounded', 'rectRot', 'star', 'triangle']
    return styles[index % styles.length];
}

const legend = {
  labels: {
      usePointStyle: true
  },
  position: 'right'
};

const scalesLog = {
  xAxes: [{
      display: true,
  }],
  yAxes: [{
      ticks: {
          beginAtZero: true,
          userCallback: function(tick) {
              var remain = tick / (Math.pow(10, Math.floor(Chart.helpers.log10(tick))));
              if (remain === 1 || remain === 2 || remain === 5) {
                  return tick.toString();
              }
              return '';
          }
      },
      display: true,
      type: 'logarithmic'
  }]
};

const scalesLin = {
  xAxes: [{
      display: true,
  }],
  yAxes: [{
      display: true,
      type: 'linear'
  }]
};

