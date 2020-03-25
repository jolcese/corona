import '../css/main.css';
import Chart from 'chart.js';
import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';
import wNumb from 'wnumb';

var DEFAULT_NUM_GRAPH = 10;
var MAX_NUM_GRAPH = 50;
var initialized = false;

// ***********************************
//
// Configuration items setup
//
// ***********************************

// Box
const box = document.createElement('div');
box.style.padding = "30px 20px 30px 20px"; 
document.body.appendChild(box);

// Log Checkbox
// var logInputCheckbox = document.createElement('input'); 
// logInputCheckbox.type = "checkbox"; 
// logInputCheckbox.name = "logInput"; 
// logInputCheckbox.value = false; 
// logInputCheckbox.id = "logInput"; 

// var logInputLabel = document.createElement('label'); 
// logInputLabel.htmlFor = "id"; 
// logInputLabel.appendChild(document.createTextNode('Log Y Axis')); 

// box.appendChild(logInputCheckbox); 
// box.appendChild(logInputLabel); 

// document.getElementById('logInputCheckbox').onclick = function() {
//     if ( this.checked ) {
//         // if checked ...
//         alert( this.value );
//     } else {
//         // if not checked ...
//     }
// }

// Slider
const inputSlider = document.createElement('div');
box.appendChild(inputSlider)
inputSlider.id = "slider";

noUiSlider.create(inputSlider, {
    start: DEFAULT_NUM_GRAPH,
    range: {
        'min': 0,
        'max': MAX_NUM_GRAPH
    },
    pips: {
        mode: 'count',
        values: 11
    },
    tooltips: true,
    format: wNumb({
        decimals: 0
    })
});

inputSlider.noUiSlider.on('update', function() {
    if (initialized == true) {
        DEFAULT_NUM_GRAPH = this.get();
        processData();
    }
});

// ***********************************
//
// Charts setup
//
// ***********************************

const legend = {
    labels: {
        usePointStyle: true
    },
    position: 'right'
};

const scales = {
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

// casesChart
const canvasCasesChart = document.createElement('canvas');
canvasCasesChart.id="casesChart";
document.body.appendChild(canvasCasesChart);
var ctxCasesChart = document.getElementById('casesChart');
var casesChart = new Chart(ctxCasesChart, {
    type: 'line',
    options: {
        legend:legend,
        responsive: true,
        title: {
            display: true,
            text: 'Coronavirus - Cases'
        },
        scales: scales
    }    
});

// deathsChart
const canvasDeathsChart = document.createElement('canvas');
canvasDeathsChart.id="deathsChart";
document.body.appendChild(canvasDeathsChart);
var ctxDeathsChart = document.getElementById('deathsChart');
var deathsChart = new Chart(ctxDeathsChart, {
    type: 'line',
    options: {
        legend:legend,
        responsive: true,
        title: {
            display: true,
            text: 'Coronavirus - Deaths'
        },
        scales: scales
    }
});

// ***********************************
//
// Data handling and local caching
//
// ***********************************

var localData = window.localStorage.getItem('Data');
var savedTime = window.localStorage.getItem('Time');

var now = new Date();

if (localData == null || (now.getTime() - savedTime > (1000 * 60 * 15))) { // 15 minutes 
    getData(processData);
} else {
    console.log('Using cached data. Last refresh: ' + (now.getTime() - savedTime) / 1000 + ' seconds ago')
    processData();
}

function getData(callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            window.localStorage.setItem('Data', xmlHttp.responseText);
            
            var saveTime = new Date();
            window.localStorage.setItem('Time', saveTime.getTime());
            
            callback();
        } else {
            console.log('Not ready yet - Status: ' + xmlHttp.status + ' - ReadyState: ' + xmlHttp.readyState);
        }
    }
    xmlHttp.open("GET", "https://corona.lmao.ninja/v2/historical", true); // true for asynchronous 
    xmlHttp.send(null);
}

// ***********************************
//
// Data Processing
//
// ***********************************

function processData() {
    
    const Data = JSON.parse(window.localStorage.getItem('Data'));
    
    var dateLabels = [];
    dateLabels = Object.keys(Data[0].timeline.cases);
    
    //inputSlider.max = Data.length;
    //inputSlider.value = DEFAULT_NUM_GRAPH;

    var casesDatasets = [];
    var deathsDatasets = [];
    
    // Generate datasets
    for (var i = 0; i < Data.length ; i++) {
        
        var label = Data[i].country;
        if (Data[i].province !== null ) {
            label = Data[i].country + ' - ' + Data[i].province;
        }
        
        var casesData = Object.values(Data[i].timeline.cases);    
        casesDatasets.push({
            label: toTitleCase(label),
            data: casesData,
            fill: false,
            lineTension: 0
        });
        var deathsData = Object.values(Data[i].timeline.deaths);    
        deathsDatasets.push({
            label: toTitleCase(label),
            data: deathsData,
            fill: false,
            lineTension: 0
        });
    }
    
    // Sort and prune casesDataset
    casesDatasets.sort(compareMaxArray);
    casesDatasets = casesDatasets.reverse();
    var casesDatasetsResult = casesDatasets.slice(0,DEFAULT_NUM_GRAPH);
    
    for (var i = 0; i < casesDatasetsResult.length ; i++) {
        casesDatasetsResult[i].borderColor = calcColor(0,DEFAULT_NUM_GRAPH, DEFAULT_NUM_GRAPH - i);
        casesDatasetsResult[i].backgroundColor = calcColor(0,DEFAULT_NUM_GRAPH, DEFAULT_NUM_GRAPH - i);
        casesDatasetsResult[i].pointStyle = pointStyle(i);
        casesDatasetsResult[i].pointRadius = 4;
    }
    
    casesChart.data = {
        labels: dateLabels,
        datasets: casesDatasetsResult
    };
    casesChart.update();

    // Sort and prune deathsDataset
    deathsDatasets.sort(compareMaxArray);
    deathsDatasets = deathsDatasets.reverse();
    var deathsDatasetsResult = deathsDatasets.slice(0,DEFAULT_NUM_GRAPH);
    
    for (var i = 0; i < deathsDatasetsResult.length ; i++) {
        deathsDatasetsResult[i].borderColor = calcColor(0,DEFAULT_NUM_GRAPH, DEFAULT_NUM_GRAPH - i);
        deathsDatasetsResult[i].backgroundColor = calcColor(0,DEFAULT_NUM_GRAPH, DEFAULT_NUM_GRAPH - i);
        deathsDatasetsResult[i].pointStyle = pointStyle(i);
        deathsDatasetsResult[i].pointRadius = 4;
    }
    
    deathsChart.data = {
        labels: dateLabels,
        datasets: deathsDatasetsResult
    };
    deathsChart.update();

    initialized = true;
}

// ***********************************
//
// Helper functions
//
// ***********************************

function compareMaxArray(a, b) {
    let comparison = 0;
    if (parseInt(a.data[a.data.length-2]) > parseInt(b.data[b.data.length-2])) comparison = 1;
    if (parseInt(a.data[a.data.length-2]) < parseInt(b.data[b.data.length-2])) comparison = -1;
    return comparison;
}

function calcColor(min, max, val)
{
    var minHue = 240, maxHue=0;
    var curPercent = (val - min) / (max-min);
    var colString = "hsl(" + ((curPercent * (maxHue-minHue) ) + minHue) + ",100%,50%)";
    return colString;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function pointStyle(index) {
    //   var styles = [ 'circle', 'cross', 'crossRot', 'dash', 'line', 'rect', 'rectRounded', 'rectRot', 'star', 'triangle']
    var styles = [ 'circle', 'cross', 'crossRot', 'rect', 'rectRounded', 'rectRot', 'star', 'triangle']
    return styles[index % styles.length];
}