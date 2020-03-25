import _ from 'lodash';
import Chart from 'chart.js';

// Get data from https://corona.lmao.ninja/v2/historical
// import Data from '../data/historical.json';

// const covid = require('novelcovid');

// (async () => {
//     let all = await covid.historical();
//     return console.log(all);

// })();


const canvasCasesChart = document.createElement('canvas');
canvasCasesChart.id="casesChart";
document.body.appendChild(canvasCasesChart);
var ctxCasesChart = document.getElementById('casesChart');

const canvasDeathsChart = document.createElement('canvas');
canvasDeathsChart.id="deathsChart";
document.body.appendChild(canvasDeathsChart);
var ctxDeathsChart = document.getElementById('deathsChart');


var NUM_GRAPH = 30;



var xmlHttp = new XMLHttpRequest();
xmlHttp.onreadystatechange = function() { 
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        processData(JSON.parse(xmlHttp.responseText));
}
xmlHttp.open("GET", "https://corona.lmao.ninja/v2/historical", true); // true for asynchronous 
xmlHttp.send(null);


function processData(Data) {

    var dateLabels = [];
    dateLabels = Object.keys(Data[0].timeline.cases);

    var casesDatasets = [];
    var deathsDatasets = [];

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

    casesDatasets.sort(compareMaxArray);
    casesDatasets = casesDatasets.reverse();
    var casesDatasetsResult = casesDatasets.slice(0,NUM_GRAPH);

    for (var i = 0; i < casesDatasetsResult.length ; i++) {
        casesDatasetsResult[i].borderColor = calcColor(0,NUM_GRAPH, NUM_GRAPH - i);
        casesDatasetsResult[i].backgroundColor = calcColor(0,NUM_GRAPH, NUM_GRAPH - i);
        casesDatasetsResult[i].pointStyle = pointStyle(i);
        casesDatasetsResult[i].pointRadius = 4;
    }

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
            type: 'logarithmic',
        }]
    };

    const legend = {
        labels: {
            usePointStyle: true
        },
        position: 'right'
    };

    var casesChart = new Chart(ctxCasesChart, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: casesDatasetsResult
        },
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

    deathsDatasets.sort(compareMaxArray);
    deathsDatasets = deathsDatasets.reverse();
    var deathsDatasetsResult = deathsDatasets.slice(0,NUM_GRAPH);

    for (var i = 0; i < deathsDatasetsResult.length ; i++) {
        deathsDatasetsResult[i].borderColor = calcColor(0,NUM_GRAPH, NUM_GRAPH - i);
        deathsDatasetsResult[i].backgroundColor = calcColor(0,NUM_GRAPH, NUM_GRAPH - i);
        deathsDatasetsResult[i].pointStyle = pointStyle(i);
        deathsDatasetsResult[i].pointRadius = 4;
    }

    var deathsChart = new Chart(ctxDeathsChart, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: deathsDatasetsResult
        },
        options: {
            legend: legend,
            responsive: true,
            title: {
                display: true,
                text: 'Coronavirus - Deaths'
            },
            scales: scales
        }
    });
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