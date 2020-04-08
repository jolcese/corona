import {getLocalData, setLocalData} from './localStorage.js';

export function getSourceData(days, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            setLocalData('Data', xmlHttp.responseText);
            
            var saveTime = new Date();
            setLocalData('Time', saveTime.getTime());
            
            callback();
        } else {
            console.log('Not ready yet - Status: ' + xmlHttp.status + ' - ReadyState: ' + xmlHttp.readyState);
            if (xmlHttp.readyState == 4) {
                console.log('Request failed. Using cached data')
                callback();
            }
        }
    }
    xmlHttp.open("GET", "https://corona.lmao.ninja/v2/historical?lastdays=" + days, true); // true for asynchronous 
    xmlHttp.send(null);
}