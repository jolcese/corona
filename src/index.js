import '../css/main.css';
import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';
import countriesData from '../data/countries-data.csv'
import wNumb from 'wnumb';
import {timestamp, formatDate} from './datesHelper.js';
import {sliceCountries, sliceTimelineAfterThreshold, mergeProvincesAndSeparateColonies, calculatePerMillionData} from './dataHandler.js';
import {createChart, addDataToDataset, updateChart, updateChartScale} from './chartHelper.js';
import {getSourceData} from './sourceData.js';
import {getLocalData, setLocalData} from './localStorage.js';
import {createInput, createInputSlider } from './inputElements.js';

var MAX_NUM_CHARTS = 100;
var REQUEST_DAYS = getLocalData('RequestDays', 365);
var NUM_CHARTS = getLocalData('NumGraphs', 10);
var MIN_PER_MILLION_THRESHOLD = getLocalData('MinPerMillion', 0.1);
var MIN_POPULATION = getLocalData('MinPopulation', 100000);
var LOG_AXIS = (getLocalData('LogAxis', 'true') == 'true');
var THRESHOLD_CASES_NTH = getLocalData('ThresholdCases', 500);
var THRESHOLD_DEATHS_NTH = getLocalData('ThresholdDeaths', 100);
var THRESHOLD_CASES_MILLION_NTH = getLocalData('ThresholdCasesMillion', 50);
var THRESHOLD_DEATHS_MILLION_NTH = getLocalData('ThresholdDeathsMillion', 5);

var CONTINENT_AFRICA = (getLocalData('ContinentAfrica', 'true') == 'true');
var CONTINENT_AMERICAS = (getLocalData('ContinentAmericas', 'true') == 'true');
var CONTINENT_ASIA = (getLocalData('ContinentAsia', 'true') == 'true');
var CONTINENT_EUROPE = (getLocalData('ContinentEurope', 'true') == 'true');
var CONTINENT_OCEANIA = (getLocalData('ContinentOceania', 'true') == 'true');

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
var inputPeriod = createInput(controlBox, 'value', 'inputPeriod', REQUEST_DAYS, 'Requested data for (days):', true);
inputPeriod.onchange = function() {    
    if (initialized == true) {
        REQUEST_DAYS = this.value;
        setLocalData('RequestDays', REQUEST_DAYS);
        datesSliderinitialized = false;
        getSourceData(REQUEST_DAYS, processData);
    }    
}

// Minimum population for per million graphs
var inputMinPerMillion = createInput(controlBox, 'value', 'inputMinPerMillion', MIN_POPULATION, 'Min country population for per million graphs:', true);
inputMinPerMillion.onchange = function() {    
    if (initialized == true) {
        MIN_POPULATION = this.value;
        setLocalData('MinPopulation', MIN_POPULATION);
        processData();
    }     
}

// Minimum value for per million graphs
var inputMinPerMillionAxis = createInput(controlBox, 'value', 'inputMinPerMillionAxis', MIN_PER_MILLION_THRESHOLD, 'Min Y-axis value for per million graphs:', true);
inputMinPerMillionAxis.onchange = function() {    
    if (initialized == true) {
        MIN_PER_MILLION_THRESHOLD = this.value;
        setLocalData('MinPerMillion', MIN_PER_MILLION_THRESHOLD);
        processData();
    }    
}

// Threshold for cases Graph
var inputThresholdCasesNth = createInput(controlBox, 'value', 'inputThresholdCasesNth', THRESHOLD_CASES_NTH, 'Starting value for after nth cases graph:', true);
inputThresholdCasesNth.onchange = function() {    
    if (initialized == true) {
        THRESHOLD_CASES_NTH = this.value;
        setLocalData('ThresholdCases', THRESHOLD_CASES_NTH);
        processData();
    }    
}

// Threshold for cases Million Graph
var inputThresholdCasesMillionNth = createInput(controlBox, 'value', 'inputThresholdCasesMillionNth', THRESHOLD_CASES_MILLION_NTH, 'Starting value for after nth cases Million graph:', true);
inputThresholdCasesMillionNth.onchange = function() {    
    if (initialized == true) {
        THRESHOLD_CASES_MILLION_NTH = this.value;
        setLocalData('ThresholdCasesMillion', THRESHOLD_CASES_MILLION_NTH);
        processData();
    }    
}

// Threshold for deaths Graph
var inputThresholdDeathsNth = createInput(controlBox, 'value', 'inputThresholdDeathsNth', THRESHOLD_DEATHS_NTH, 'Starting value for after nth deaths graph:', true);
inputThresholdDeathsNth.onchange = function() {    
    if (initialized == true) {
        THRESHOLD_DEATHS_NTH = this.value;
        setLocalData('ThresholdDeaths', THRESHOLD_DEATHS_NTH);
        processData();
    }    
}

// Threshold for deaths Million Graph
var inputThresholdDeathsMillionNth = createInput(controlBox, 'value', 'inputThresholdDeathsMillionNth', THRESHOLD_DEATHS_MILLION_NTH, 'Starting value for after nth deaths million graph:', true);
inputThresholdDeathsMillionNth.onchange = function() {    
    if (initialized == true) {
        THRESHOLD_DEATHS_MILLION_NTH = this.value;
        setLocalData('ThresholdDeathsMillion', THRESHOLD_DEATHS_MILLION_NTH);
        processData();
    }    
}

// Log Checkbox
var inputMinPerMillionAxis = createInput(controlBox, 'checkbox', 'logInputCheckbox', LOG_AXIS, 'Log Y Axis', true);
inputMinPerMillionAxis.onchange = function() {
    LOG_AXIS = this.checked;
    setLocalData('LogAxis', LOG_AXIS);
    
    updateChartScale(casesChart, this.checked);
    updateChartScale(casesAfterChart, this.checked);
    updateChartScale(casesMillionChart, this.checked);
    updateChartScale(casesMillionAfterChart, this.checked);
    updateChartScale(deathsChart, this.checked);
    updateChartScale(deathsAfterChart, this.checked);
    updateChartScale(deathsMillionChart, this.checked);
    updateChartScale(deathsMillionAfterChart, this.checked);
}

// Continents
var africa = createInput(controlBox, 'checkbox', 'africa', CONTINENT_AFRICA, 'Africa', false);
var america = createInput(controlBox, 'checkbox', 'america',  CONTINENT_AMERICAS, '| America', false);
var asia = createInput(controlBox, 'checkbox', 'asia', CONTINENT_ASIA, '| Asia', false);
var europe = createInput(controlBox, 'checkbox', 'europe', CONTINENT_EUROPE, '| Europe', false);
var oceania = createInput(controlBox, 'checkbox', 'oceania', CONTINENT_OCEANIA, '| Oceania', true);

var populationObject = {};
countriesData.forEach(country => populationObject[country[0]]=country[1]);

var continentObject = {};
countriesData.forEach(country => continentObject[country[0]]=country[2]);

africa.onchange = function() { 
    if (initialized == true) {
        CONTINENT_AFRICA = this.checked;
        setLocalData('ContinentAfrica', CONTINENT_AFRICA);
        processData();
    }
}
america.onchange = function() { 
    if (initialized == true) {
        CONTINENT_AMERICAS = this.checked;
        setLocalData('ContinentAmericas', CONTINENT_AMERICAS);
        processData();
    }
}
asia.onchange = function() { 
if (initialized == true) {
    CONTINENT_ASIA = this.checked;
    setLocalData('ContinentAsia', CONTINENT_ASIA);
    processData();
}
}
europe.onchange = function() { 
if (initialized == true) {
    CONTINENT_EUROPE = this.checked;
    setLocalData('ContinentEurope', CONTINENT_EUROPE);
    processData();
}
}
oceania.onchange = function() { 
if (initialized == true) {
    CONTINENT_OCEANIA = this.checked;
    setLocalData('ContinentOceania', CONTINENT_OCEANIA);
    processData();
}
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

function initializeDatesSlider(rawDateLabels) {
    datesSlider.noUiSlider.updateOptions({
        range: {
            'min': timestamp(rawDateLabels[0]),
            'max': timestamp(rawDateLabels[rawDateLabels.length-1])
        },
        start: [timestamp(rawDateLabels[0]),timestamp(rawDateLabels[rawDateLabels.length-1])]
    });
    // console.log('Slider: 0 - ' + String(rawDateLabels.length-1));
    
    startRawDataIndex = startGraphIndex = 0;
    endRawDataIndex = endGraphIndex = rawDateLabels.length;
    
    startRawDataEpoch = timestamp(rawDateLabels[0]);
    endRawDataEpoch = timestamp(rawDateLabels[rawDateLabels.length-1]);
    
    // console.log(new Date(startRawDataEpoch));
    eventStartLabel.innerHTML = 'Start: ' + formatDate(new Date(startRawDataEpoch));
    eventEndLabel.innerHTML = '  -  End: ' + formatDate(new Date(endRawDataEpoch));
}

// ***********************************
//
// Charts setup
//
// ***********************************

// casesChart
var casesChart = createChart(document.body, 'Coronavirus - Cases', LOG_AXIS);
// casesAfterChart
var casesAfterChart = createChart(document.body, 'Coronavirus - Cases after ' + THRESHOLD_CASES_NTH + 'th case', LOG_AXIS);
// casesMillionChart
var casesMillionChart = createChart(document.body, 'Coronavirus - Cases per million', LOG_AXIS);
// casesMillionAfterChart
var casesMillionAfterChart = createChart(document.body, 'Coronavirus - Cases per million after ' + THRESHOLD_CASES_MILLION_NTH + 'th cases per million', LOG_AXIS);
// deathsChart
var deathsChart = createChart(document.body, 'Coronavirus - Deaths', LOG_AXIS);
// deathsAfterChart
var deathsAfterChart = createChart(document.body, 'Coronavirus - Deaths after ' + THRESHOLD_DEATHS_NTH + 'th death', LOG_AXIS);
// deathsMillionChart
var deathsMillionChart = createChart(document.body, 'Coronavirus - Deaths per million', LOG_AXIS);
// deathsMillionAfterChart
var deathsMillionAfterChart = createChart(document.body, 'Coronavirus - CasDeathses per million after ' + THRESHOLD_DEATHS_MILLION_NTH + 'th deaths per million', LOG_AXIS);

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
        initializeDatesSlider(rawDateLabels);
        datesSliderinitialized = true;
    }
    
    slicedDateLabels = rawDateLabels.slice(startGraphIndex, endGraphIndex);
    
    const mergedData = mergeProvincesAndSeparateColonies(storedData);
    const slicedData = sliceCountries(mergedData, startGraphIndex, endGraphIndex);
    
    var casesDatasets = [];
    var casesMillionDatasets = [];
    var deathsDatasets = [];
    var deathsMillionDatasets = [];
    
    // Generate datasets
    for (var slicedCountryData of slicedData) {
        
        const dataLabel = slicedCountryData.country;

        // console.log(slicedCountryData.country + ' - ' + continentObject[slicedCountryData.country.toLowerCase()]);
        if (addCountry(continentObject[slicedCountryData.country.toLowerCase()])) {

            var population = populationObject[slicedCountryData.country.toLowerCase()];

            addDataToDataset(casesDatasets, dataLabel, slicedCountryData.timeline.cases);
            addDataToDataset(casesMillionDatasets, dataLabel, calculatePerMillionData(slicedCountryData.timeline.cases, population, MIN_POPULATION, MIN_PER_MILLION_THRESHOLD));
            addDataToDataset(deathsDatasets, dataLabel, slicedCountryData.timeline.deaths);
            addDataToDataset(deathsMillionDatasets, dataLabel, calculatePerMillionData(slicedCountryData.timeline.deaths, population, MIN_POPULATION, MIN_PER_MILLION_THRESHOLD));    
        }
    }

    updateChart(casesChart, slicedDateLabels, casesDatasets, NUM_CHARTS);
    updateChart(casesMillionChart, slicedDateLabels, casesMillionDatasets, NUM_CHARTS);
    updateChart(deathsChart, slicedDateLabels, deathsDatasets, NUM_CHARTS);
    updateChart(deathsMillionChart, slicedDateLabels, deathsMillionDatasets, NUM_CHARTS);

    var maxCasesDay = 0;
    var maxCasesMillonDay = 0;
    var maxDeathsDay = 0;
    var maxDeathsMillionDay = 0;
    
    var casesAfterDatasets = [];
    var casesMillionAfterDatasets = [];
    var deathsAfterDatasets = [];
    var deathsMillionAfterDatasets = [];

    // Generate datasets
    for (var countryData of mergedData) {
        
        const dataLabel = countryData.country;

        // console.log(slicedAfterCountryData.country + ' - ' + continentObject[slicedAfterCountryData.country.toLowerCase()]);
        if (addCountry(continentObject[countryData.country.toLowerCase()])) {
            
            var population = populationObject[countryData.country.toLowerCase()];

            var casesSlicedTimeline = sliceTimelineAfterThreshold(countryData.timeline.cases, THRESHOLD_CASES_NTH);
            var casesMillionSlicedTimeline = sliceTimelineAfterThreshold(calculatePerMillionData(countryData.timeline.cases, population, MIN_POPULATION, MIN_PER_MILLION_THRESHOLD), THRESHOLD_CASES_MILLION_NTH);
            var deathsSlicedTimeline = sliceTimelineAfterThreshold(countryData.timeline.deaths, THRESHOLD_DEATHS_NTH);
            var deathsMillionSlicedTimeline = sliceTimelineAfterThreshold(calculatePerMillionData(countryData.timeline.deaths, population, MIN_POPULATION, MIN_PER_MILLION_THRESHOLD), THRESHOLD_DEATHS_MILLION_NTH);

            var casesLength = Object.keys(casesSlicedTimeline).length;
            var casesMillionLength = Object.keys(casesMillionSlicedTimeline).length;
            var deathsLength = Object.keys(deathsSlicedTimeline).length;
            var deathsMillionLength = Object.keys(deathsMillionSlicedTimeline).length;

            if (casesLength > maxCasesDay) maxCasesDay = casesLength;
            if (casesMillionLength > maxCasesMillonDay) maxCasesMillonDay = casesMillionLength;
            if (deathsLength > maxDeathsDay) maxDeathsDay = deathsLength;
            if (deathsMillionLength > maxDeathsMillionDay) maxDeathsMillionDay = deathsMillionLength;

            if (casesLength > 0) {
                addDataToDataset(casesAfterDatasets, dataLabel, casesSlicedTimeline);
            }
            if (casesMillionLength > 0) {
                addDataToDataset(casesMillionAfterDatasets, dataLabel, casesMillionSlicedTimeline);
            }
            if (deathsLength > 0) {
                addDataToDataset(deathsAfterDatasets, dataLabel, deathsSlicedTimeline);
            }
            if (deathsMillionLength > 0) {
                addDataToDataset(deathsMillionAfterDatasets, dataLabel, deathsMillionSlicedTimeline);
            }

        }
    }
    
    var casesDaysLabels = Array.from(Array(maxCasesDay).keys());
    var casesMillionDaysLabels = Array.from(Array(maxCasesMillonDay).keys());
    var deathsDaysLabels = Array.from(Array(maxDeathsDay).keys());
    var deathsMillionDaysLabels = Array.from(Array(maxDeathsMillionDay).keys());

    updateChart(casesAfterChart, casesDaysLabels, casesAfterDatasets, NUM_CHARTS);
    updateChart(casesMillionAfterChart, casesMillionDaysLabels, casesMillionAfterDatasets, NUM_CHARTS);
    updateChart(deathsAfterChart, deathsDaysLabels, deathsAfterDatasets, NUM_CHARTS);
    updateChart(deathsMillionAfterChart, deathsMillionDaysLabels, deathsMillionAfterDatasets, NUM_CHARTS);
    
    initialized = true;
}

function addCountry(continent) {
    return ((CONTINENT_AFRICA === true && continent == 'Africa') || 
    (CONTINENT_AMERICAS == true && continent == 'Americas') ||
    (CONTINENT_ASIA === true && continent == 'Asia') ||
    (CONTINENT_EUROPE === true && continent == 'Europe') ||
    (CONTINENT_OCEANIA === true && continent == 'Oceania')); 
}
