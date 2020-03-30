import '../css/main.css';
import Chart from 'chart.js';
import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';
import wNumb from 'wnumb';
import population from '../data/countries-population.csv'

var DEFAULT_NUM_GRAPH = 10;
var MAX_NUM_GRAPH = 100;
var CASE_MILLION_MIN_POPULATION = 0;
// var CASE_MILLION_MIN_POPULATION = 500000;

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

// casesMillionChart
const canvasCasesMillionChart = document.createElement('canvas');
canvasCasesMillionChart.id="casesMillionChart";
document.body.appendChild(canvasCasesMillionChart);
var ctxCasesMillionChart = document.getElementById('casesMillionChart');
var casesMillionChart = new Chart(ctxCasesMillionChart, {
    type: 'line',
    options: {
        legend:legend,
        responsive: true,
        title: {
            display: true,
            text: 'Coronavirus - Cases per million'
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

// deathsMillionChart
const canvasDeathsMillionChart = document.createElement('canvas');
canvasDeathsMillionChart.id="deathsMillionChart";
document.body.appendChild(canvasDeathsMillionChart);
var ctxDeathsMillionChart = document.getElementById('deathsMillionChart');
var deathsMillionChart = new Chart(ctxDeathsMillionChart, {
    type: 'line',
    options: {
        legend:legend,
        responsive: true,
        title: {
            display: true,
            text: 'Coronavirus - Deaths per million'
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
            if (xmlHttp.readyState == 4) {
                console.log('Request failed. Using cached data')
                callback();
            }
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
    
    const storedData = JSON.parse(window.localStorage.getItem('Data'));
    
    var dateLabels = [];
    dateLabels = Object.keys(storedData[0].timeline.cases);
    
    var casesDatasets = [];
    var casesMillionDatasets = [];
    var deathsDatasets = [];
    var deathsMillionDatasets = [];
    
    var cleanedData = [];
    //inputSlider.max = Data.length;
    //inputSlider.value = DEFAULT_NUM_GRAPH;

    cleanedData = mergeAndCleanUpProvinces(storedData);

    // Generate datasets
    for (var country of cleanedData) {
        
        var label = country.country;
        // if (country.province !== null ) {
        //     label = country.country + ' - ' + country.province;
        // }

        pushData(casesDatasets, label, Object.values(country.timeline.cases));
        pushData(casesMillionDatasets, label, calculatePerMillionDataset(country, 'cases'));
        pushData(deathsDatasets, label, Object.values(country.timeline.deaths));
        pushData(deathsMillionDatasets, label, calculatePerMillionDataset(country, 'deaths'));
    }
    
    updateChart(casesChart, dateLabels, casesDatasets);
    updateChart(casesMillionChart, dateLabels, casesMillionDatasets);
    updateChart(deathsChart, dateLabels, deathsDatasets);
    updateChart(deathsMillionChart, dateLabels, deathsMillionDatasets);

    initialized = true;
}

// Update data to per million
function calculatePerMillionDataset (country, type) {
    var populationObject = {};
    population.forEach(country => populationObject[country[0]]=country[1]);

    var perMillionData = Object.values(country.timeline[type]);

    var countryname = country.country.toLowerCase();
    
    if ((country.province !== null && country.province != country.country ) || populationObject[countryname] == undefined || populationObject[countryname] < CASE_MILLION_MIN_POPULATION)
    {
        perMillionData = perMillionData.map(x => x * 0); 
        console.log(country.country + ' - ' + country.province + ' - ' + populationObject[countryname])
    } 
    else {
        perMillionData = perMillionData.map(x => x * 1000000 / populationObject[countryname]); 
    }
    return (perMillionData)
}

// Add data into dataset
function pushData(dataset, label, data) {
    dataset.push({
        label: toTitleCase(label),
        data: data,
        fill: false,
        lineTension: 0
    });
}

// Merge countries with provinces and separate colonies
function mergeAndCleanUpProvinces(originalData) {

    var cleanedData = [];
    for (var country of originalData) {

        var countryname = country.country.toLowerCase();

        if (countryname == 'france' || countryname == 'uk' || countryname == 'denmark' || countryname == 'netherlands') {
            // Countries with colonies
            if (!country.province)
            {
                var obj = country;
                cleanedData.push(obj);
            }
            else 
            {
                var obj = country;
                // obj.country = obj.province + ' (' + country.country + ')';
                obj.country = obj.province;
                obj.province = null;
                cleanedData.push(obj);
            }
        }
        else if (countryname == 'china' || countryname == 'australia' || countryname == 'canada') {
            // Countries with provinces/states
            var obj = country;
            obj.province = null;

            var foundAndAppended = false;
            for (var idx = 0; idx < cleanedData.length; idx++) {
                if (cleanedData[idx].country === obj.country) {


                    //MERGE



                    foundAndAppended = true;
                }
            }
            if (!foundAndAppended) {
                cleanedData.push(obj)
            }
        }
        else {
            // All other countries
            cleanedData.push(country);
        }
    }
    return cleanedData;
}

// Sort, prune to max # graphs and update graph
function updateChart(chart, dateLabels, dataset) {
    dataset.sort(compareMaxArray);
    dataset = dataset.reverse();
    var datasetResult = dataset.slice(0,DEFAULT_NUM_GRAPH);
    datasetResult = setLineStyle(datasetResult);
    chart.data = {
        labels: dateLabels,
        datasets: datasetResult
    };
    chart.update();
}


// ***********************************
//
// Helper functions
//
// ***********************************

function setLineStyle(dataset) {
    for (var i = 0; i < dataset.length ; i++) {
        dataset[i].borderColor = calcColor(0,DEFAULT_NUM_GRAPH, DEFAULT_NUM_GRAPH - i);
        dataset[i].backgroundColor = calcColor(0,DEFAULT_NUM_GRAPH, DEFAULT_NUM_GRAPH - i);
        dataset[i].pointStyle = pointStyle(i);
        dataset[i].pointRadius = 4;
    }
    return (dataset)
}

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