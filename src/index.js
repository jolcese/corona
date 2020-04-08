import '../css/main.css';
import Chart from 'chart.js';
import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';
import wNumb from 'wnumb';
import {timestamp, formatDate} from './datesHelper.js';
import {cleanupCountriesData, calculatePerMillionData} from './dataHandler.js';
import {createChart, addDataToDataset, updateChart, updateChartScale} from './chartHelper.js';
import {getSourceData} from './sourceData.js';

var MAX_NUM_CHARTS = 100;
var REQUEST_DAYS = getLocalData('RequestDays', 365);
var NUM_CHARTS = getLocalData('NumGraphs', 10);
var MIN_VALUE_PER_MILLION = getLocalData('MinPerMillion', 0.1);
var CASE_MILLION_MIN_POPULATION = getLocalData('MinPopulation', 100000);
var LOG_AXIS = getLocalData('LogAxis', "true");

var initialized = false;

// ***********************************
//
// Configuration items setup
//
// ***********************************

// Controls Box
const controlBox = document.createElement('div');
controlBox.style.padding = "30px 20px 30px 20px"; 
document.body.appendChild(controlBox);

// Request Data for x days
var inputPeriod = document.createElement('input'); 
inputPeriod.type = "value"; 
inputPeriod.name = "inputPeriod"; 
inputPeriod.value = REQUEST_DAYS; 
inputPeriod.id = "inputPeriod"; 

var inputPeriodLabel = document.createElement('label'); 
inputPeriodLabel.htmlFor = "id"; 
inputPeriodLabel.appendChild(document.createTextNode('Requested data for (days): ')); 

controlBox.appendChild(inputPeriodLabel); 
controlBox.appendChild(inputPeriod); 
controlBox.appendChild(document.createElement("br"));

document.getElementById('inputPeriod').onchange = function() {    
    if (initialized == true) {
        REQUEST_DAYS = this.value;
        window.localStorage.setItem('RequestDays', REQUEST_DAYS);
        datesSliderinitialized = false;
        getSourceData(REQUEST_DAYS, processData);
    }    
}

// Minimum population for per million graphs
var inputMinPerMillion = document.createElement('input'); 
inputMinPerMillion.type = "value"; 
inputMinPerMillion.name = "inputMinPerMillion"; 
inputMinPerMillion.value = CASE_MILLION_MIN_POPULATION; 
inputMinPerMillion.id = "inputMinPerMillion"; 

var inputMinPerMillionLabel = document.createElement('label'); 
inputMinPerMillionLabel.htmlFor = "id"; 
inputMinPerMillionLabel.appendChild(document.createTextNode('Min country population for per million graphs: ')); 

controlBox.appendChild(inputMinPerMillionLabel); 
controlBox.appendChild(inputMinPerMillion); 
controlBox.appendChild(document.createElement("br"));

document.getElementById('inputMinPerMillion').onchange = function() {    
    if (initialized == true) {
        CASE_MILLION_MIN_POPULATION = this.value;
        window.localStorage.setItem('MinPopulation', CASE_MILLION_MIN_POPULATION);
        processData();
    }    
}

// Minimum value for per million graphs
var inputMinPerMillionAxis = document.createElement('input'); 
inputMinPerMillionAxis.type = "value"; 
inputMinPerMillionAxis.name = "inputMinPerMillionAxis"; 
inputMinPerMillionAxis.value = MIN_VALUE_PER_MILLION; 
inputMinPerMillionAxis.id = "inputMinPerMillionAxis"; 

var inputMinPerMillionAxisLabel = document.createElement('label'); 
inputMinPerMillionAxisLabel.htmlFor = "id"; 
inputMinPerMillionAxisLabel.appendChild(document.createTextNode('Min Y-axis value for per million graphs: ')); 

controlBox.appendChild(inputMinPerMillionAxisLabel); 
controlBox.appendChild(inputMinPerMillionAxis); 
controlBox.appendChild(document.createElement("br"));

document.getElementById('inputMinPerMillionAxis').onchange = function() {    
    if (initialized == true) {
        MIN_VALUE_PER_MILLION = this.value;
        window.localStorage.setItem('MinPerMillion', MIN_VALUE_PER_MILLION);
        processData();
    }    
}

// Log Checkbox
var logInputCheckbox = document.createElement('input'); 
logInputCheckbox.type = "checkbox"; 
logInputCheckbox.name = "logInputCheckbox"; 
logInputCheckbox.checked = (LOG_AXIS == "true"); 
logInputCheckbox.id = "logInputCheckbox"; 

var logInputLabel = document.createElement('label'); 
logInputLabel.htmlFor = "id"; 
logInputLabel.appendChild(document.createTextNode('Log Y Axis')); 

controlBox.appendChild(logInputLabel); 
controlBox.appendChild(logInputCheckbox); 
controlBox.appendChild(document.createElement("br"));

document.getElementById('logInputCheckbox').onchange = function() {
    LOG_AXIS = this.checked;
    window.localStorage.setItem('LogAxis', LOG_AXIS);

    updateChartScale(casesChart, this.checked);
    updateChartScale(casesMillionChart, this.checked);
    updateChartScale(deathsChart, this.checked);
    updateChartScale(deathsMillionChart, this.checked);
}

// Slider number of countries
const inputSliderContainer = document.createElement('div');
inputSliderContainer.className = 'sliderspacing';
controlBox.appendChild(inputSliderContainer);
const inputSlider = document.createElement('div');
inputSlider.id = "slider";
inputSliderContainer.appendChild(inputSlider)

noUiSlider.create(inputSlider, {
    start: NUM_CHARTS,
    range: {
        'min': 0,
        'max': MAX_NUM_CHARTS
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
        NUM_CHARTS = this.get();
        window.localStorage.setItem('NumGraphs', NUM_CHARTS);
        processData();
    }
});

// Slider dates
const datesSliderContainer = document.createElement('div');
datesSliderContainer.className = 'sliderspacing';
controlBox.appendChild(datesSliderContainer)
const datesSlider = document.createElement('div');
datesSlider.id = "datesSlider";
datesSliderContainer.appendChild(datesSlider)

var datesSliderinitialized = false;

noUiSlider.create(datesSlider, {
    start: [timestamp('2019'),timestamp('2020')],
    range: {
        'min': timestamp('2019'),
        'max': timestamp('2020')
    },
    step: 24 * 60 * 60 * 1000,

});
const eventstart = document.createElement('span');
eventstart.id = "eventstart";
datesSliderContainer.appendChild(eventstart)

const eventend = document.createElement('span');
eventend.id = "eventend";
datesSliderContainer.appendChild(eventend)

var startGraphIndex, endGraphIndex = 0;
var startRawDataIndex, endRawDataIndex = 0;
var startRawDataEpoch, endRawDataEpoch = 0;

datesSlider.noUiSlider.on('update', function (values, handle) {
    if (datesSliderinitialized === true) {

        document.getElementById('eventstart').innerHTML = 'Start: ' + formatDate(new Date(+values[0]));
        document.getElementById('eventend').innerHTML = '  -  End: ' + formatDate(new Date(+values[1]));
        
        console.log(new Date(+values[0]));

        startGraphIndex = Math.floor((values[0] - startRawDataEpoch) / ((endRawDataEpoch - startRawDataEpoch) / endRawDataIndex));
        endGraphIndex = Math.floor((values[1] - startRawDataEpoch) / ((endRawDataEpoch - startRawDataEpoch) / endRawDataIndex));

        console.log()
        processData();
    }
});

// ***********************************
//
// Charts setup
//
// ***********************************

// casesChart
const canvasCasesChart = document.createElement('canvas');
canvasCasesChart.id="casesChart";
document.body.appendChild(canvasCasesChart);
var casesChart = createChart(document.getElementById('casesChart'), 'Coronavirus - Cases', LOG_AXIS);

// casesMillionChart
const canvasCasesMillionChart = document.createElement('canvas');
canvasCasesMillionChart.id="casesMillionChart";
document.body.appendChild(canvasCasesMillionChart);
var casesMillionChart = createChart(document.getElementById('casesMillionChart'), 'Coronavirus - Cases per million', LOG_AXIS);

// deathsChart
const canvasDeathsChart = document.createElement('canvas');
canvasDeathsChart.id="deathsChart";
document.body.appendChild(canvasDeathsChart);
var deathsChart = createChart(document.getElementById('deathsChart'), 'Coronavirus - Deaths', LOG_AXIS);

// deathsMillionChart
const canvasDeathsMillionChart = document.createElement('canvas');
canvasDeathsMillionChart.id="deathsMillionChart";
document.body.appendChild(canvasDeathsMillionChart);
var deathsMillionChart = createChart(document.getElementById('deathsMillionChart'), 'Coronavirus - Deaths per million', LOG_AXIS);

// ***********************************
//
// Data handling and local caching
//
// ***********************************

var localData = window.localStorage.getItem('Data');
var savedTime = window.localStorage.getItem('Time');

var now = new Date();

if (localData == null || (now.getTime() - savedTime > (1000 * 60 * 15))) { // 15 minutes 
    getSourceData(REQUEST_DAYS, processData);
} else {
    console.log('Using cached data. Last refresh: ' + (now.getTime() - savedTime) / 1000 + ' seconds ago')
    processData();
}

// ***********************************
//
// Data Processing
//
// ***********************************

function processData() {
    
    const storedData = JSON.parse(window.localStorage.getItem('Data'));
    
    var rawDateLabels = [];
    var slicedDateLabels = [];

    rawDateLabels = Object.keys(storedData[0].timeline.cases);

    if (datesSliderinitialized === false) {
        datesSlider.noUiSlider.updateOptions({
            range: {
                'min': timestamp(rawDateLabels[0]),
                'max': timestamp(rawDateLabels[rawDateLabels.length-1])
            },
            start: [timestamp(rawDateLabels[0]),timestamp(rawDateLabels[rawDateLabels.length-1])]
        });
        console.log('Slider: 0 - ' + String(rawDateLabels.length-1));
        
        startRawDataIndex = startGraphIndex = 0;
        endRawDataIndex = endGraphIndex = rawDateLabels.length;

        startRawDataEpoch = timestamp(rawDateLabels[0]);
        endRawDataEpoch = timestamp(rawDateLabels[rawDateLabels.length-1]);

        // console.log(new Date(startRawDataEpoch));
        document.getElementById('eventstart').innerHTML = 'Start: ' + formatDate(new Date(startRawDataEpoch));
        document.getElementById('eventend').innerHTML = '  -  End: ' + formatDate(new Date(endRawDataEpoch));

        datesSliderinitialized = true;
    }

    slicedDateLabels = rawDateLabels.slice(startGraphIndex, endGraphIndex);

    var casesDatasets = [];
    var casesMillionDatasets = [];
    var deathsDatasets = [];
    var deathsMillionDatasets = [];
    
    const slicedData = cleanupCountriesData(storedData, startGraphIndex, endGraphIndex);

    // Generate datasets
    for (var slicedCountryData of slicedData) {
        
        const label = slicedCountryData.country;

        addDataToDataset(casesDatasets, label, Object.values(slicedCountryData.timeline.cases));
        addDataToDataset(casesMillionDatasets, label, calculatePerMillionData(slicedCountryData, 'cases', CASE_MILLION_MIN_POPULATION, MIN_VALUE_PER_MILLION));
        addDataToDataset(deathsDatasets, label, Object.values(slicedCountryData.timeline.deaths));
        addDataToDataset(deathsMillionDatasets, label, calculatePerMillionData(slicedCountryData, 'deaths', CASE_MILLION_MIN_POPULATION, MIN_VALUE_PER_MILLION));
    }
    
    updateChart(casesChart, slicedDateLabels, casesDatasets, NUM_CHARTS);
    updateChart(casesMillionChart, slicedDateLabels, casesMillionDatasets, NUM_CHARTS);
    updateChart(deathsChart, slicedDateLabels, deathsDatasets, NUM_CHARTS);
    updateChart(deathsMillionChart, slicedDateLabels, deathsMillionDatasets, NUM_CHARTS);

    initialized = true;
}

// ***********************************
//
// Helper functions
//
// ***********************************

function getLocalData(storageVariable, defaultValue) {
    
    var local = window.localStorage.getItem(storageVariable);
    
    if (local == null ) {
        return defaultValue;
    } else {
        return local;
    }
};
