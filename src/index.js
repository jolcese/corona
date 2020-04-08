import '../css/main.css';
import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';
import wNumb from 'wnumb';
import {timestamp, formatDate} from './datesHelper.js';
import {cleanupCountriesData, calculatePerMillionData} from './dataHandler.js';
import {createChart, addDataToDataset, updateChart, updateChartScale} from './chartHelper.js';
import {getSourceData} from './sourceData.js';
import {getLocalData, setLocalData} from './localStorage.js';
import {createInput, createInputSlider } from './inputElements.js';

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
var inputPeriod = createInput(controlBox, 'value', 'inputPeriod', REQUEST_DAYS, 'Requested data for (days):');
inputPeriod.onchange = function() {    
    if (initialized == true) {
        REQUEST_DAYS = this.value;
        setLocalData('RequestDays', REQUEST_DAYS);
        datesSliderinitialized = false;
        getSourceData(REQUEST_DAYS, processData);
    }    
}

// Minimum population for per million graphs
var inputMinPerMillion = createInput(controlBox, 'value', 'inputMinPerMillion', CASE_MILLION_MIN_POPULATION, 'Min country population for per million graphs:');
inputMinPerMillion.onchange = function() {    
    if (initialized == true) {
        CASE_MILLION_MIN_POPULATION = this.value;
        setLocalData('MinPopulation', CASE_MILLION_MIN_POPULATION);
        processData();
    }     
}

// Minimum value for per million graphs
var inputMinPerMillionAxis = createInput(controlBox, 'value', 'inputMinPerMillionAxis', MIN_VALUE_PER_MILLION, 'Min Y-axis value for per million graphs:');
inputMinPerMillionAxis.onchange = function() {    
    if (initialized == true) {
        MIN_VALUE_PER_MILLION = this.value;
        setLocalData('MinPerMillion', MIN_VALUE_PER_MILLION);
        processData();
    }    
}

// Log Checkbox
var inputMinPerMillionAxis = createInput(controlBox, 'checkbox', 'logInputCheckbox', (LOG_AXIS == "true"), 'Log Y Axis');
inputMinPerMillionAxis.onchange = function() {
    LOG_AXIS = this.checked;
    setLocalData('LogAxis', LOG_AXIS);
    
    updateChartScale(casesChart, this.checked);
    updateChartScale(casesMillionChart, this.checked);
    updateChartScale(deathsChart, this.checked);
    updateChartScale(deathsMillionChart, this.checked);
}

// Slider number of countries
const inputSlider = createInputSlider(controlBox, 'inputSlider', {
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
})
inputSlider.noUiSlider.on('update', function() {
    if (initialized == true) {
        NUM_CHARTS = this.get();
        setLocalData('NumGraphs', NUM_CHARTS);
        processData();
    }
});

// Slider dates
var datesSliderinitialized = false;

const datesSlider = createInputSlider(controlBox, 'datesSlider', {
    start: [timestamp('2019'),timestamp('2020')],
    range: {
        'min': timestamp('2019'),
        'max': timestamp('2020')
    },
    step: 24 * 60 * 60 * 1000,   
});

// Slider dates labels
const eventStartLabel = document.createElement('span');
eventStartLabel.id = "eventStartLabel";
datesSlider.appendChild(eventStartLabel)
const eventEndLabel = document.createElement('span');
eventEndLabel.id = "eventEndLabel";
datesSlider.appendChild(eventEndLabel)

var startGraphIndex, endGraphIndex = 0;
var startRawDataIndex, endRawDataIndex = 0;
var startRawDataEpoch, endRawDataEpoch = 0;

datesSlider.noUiSlider.on('update', function (values, handle) {
    if (datesSliderinitialized === true) {
        
        eventStartLabel.innerHTML = 'Start: ' + formatDate(new Date(+values[0]));
        eventEndLabel.innerHTML = '  -  End: ' + formatDate(new Date(+values[1]));
        
        // console.log(new Date(+values[0]));
        
        startGraphIndex = Math.floor((values[0] - startRawDataEpoch) / ((endRawDataEpoch - startRawDataEpoch) / endRawDataIndex));
        endGraphIndex = Math.floor((values[1] - startRawDataEpoch) / ((endRawDataEpoch - startRawDataEpoch) / endRawDataIndex));
        
        processData();
    }
});

// ***********************************
//
// Charts setup
//
// ***********************************

// casesChart
var casesChart = createChart(document.body, 'Coronavirus - Cases', LOG_AXIS);
// casesMillionChart
var casesMillionChart = createChart(document.body, 'Coronavirus - Cases per million', LOG_AXIS);
// deathsChart
var deathsChart = createChart(document.body, 'Coronavirus - Deaths', LOG_AXIS);
// deathsMillionChart
var deathsMillionChart = createChart(document.body, 'Coronavirus - Deaths per million', LOG_AXIS);

// ***********************************
//
// Data handling and local caching
//
// ***********************************

var localData = getLocalData('Data');
var savedTime = getLocalData('Time');

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
    
    const storedData = JSON.parse(getLocalData('Data'));
    
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
        eventStartLabel.innerHTML = 'Start: ' + formatDate(new Date(startRawDataEpoch));
        eventEndLabel.innerHTML = '  -  End: ' + formatDate(new Date(endRawDataEpoch));
        
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
        
        const dataLabel = slicedCountryData.country;
        
        addDataToDataset(casesDatasets, dataLabel, Object.values(slicedCountryData.timeline.cases));
        addDataToDataset(casesMillionDatasets, dataLabel, calculatePerMillionData(slicedCountryData, 'cases', CASE_MILLION_MIN_POPULATION, MIN_VALUE_PER_MILLION));
        addDataToDataset(deathsDatasets, dataLabel, Object.values(slicedCountryData.timeline.deaths));
        addDataToDataset(deathsMillionDatasets, dataLabel, calculatePerMillionData(slicedCountryData, 'deaths', CASE_MILLION_MIN_POPULATION, MIN_VALUE_PER_MILLION));
    }
    
    updateChart(casesChart, slicedDateLabels, casesDatasets, NUM_CHARTS);
    updateChart(casesMillionChart, slicedDateLabels, casesMillionDatasets, NUM_CHARTS);
    updateChart(deathsChart, slicedDateLabels, deathsDatasets, NUM_CHARTS);
    updateChart(deathsMillionChart, slicedDateLabels, deathsMillionDatasets, NUM_CHARTS);
    
    initialized = true;
}
