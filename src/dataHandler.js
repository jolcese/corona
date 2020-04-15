// Returs an slice of a country's timeline
export function sliceCountries(rawCountriesData, start, end) {

    var slicedCountriesData = [];
    for (var rawCountryData of rawCountriesData) {

        var tempCountryData = JSON.parse(JSON.stringify(rawCountryData));
        var slicedTimeline = {};
        
        for (var type of ['cases','deaths','recovered']) {
            var obj = {};
            var idx = 0;
            for (var key of Object.keys(rawCountryData.timeline[type])) 
            {
                if (start <= idx && end >= idx) obj[key] = rawCountryData.timeline[type][key];
                idx++;
            }
            slicedTimeline[type] = obj;
        }
        tempCountryData.timeline = slicedTimeline;

        slicedCountriesData.push(tempCountryData);

    }
    return slicedCountriesData;
}

// Returs an slice of a timeline above a threshold
export function sliceTimelineAfterThreshold(timeline, threshold) {

    var slicedTimeline = {};
    var obj = {};
    var idx = 0;
    var found = false;

    for (var key of Object.keys(timeline)) 
    {
        if (timeline[key] >= threshold || found === true) {
            slicedTimeline[idx] = timeline[key];
            found = true;
            idx++;
        }
    }

    return slicedTimeline
}


// Merge countries with provinces and separate colonies
export function mergeProvincesAndSeparateColonies(rawCountriesData) {

    var cleanedCountriesData = [];
    for (var rawCountryData of rawCountriesData) {
  
        var countryName = rawCountryData.country.toLowerCase();
        var tempCountryData;
        
        if (countryName == 'france' || countryName == 'uk' || countryName == 'denmark' || countryName == 'netherlands') {
            // Countries with colonies
            // Will split colonies into their own countries.
  
            tempCountryData = rawCountryData;
  
            if (rawCountryData.province)
            {
              tempCountryData = rawCountryData;
              tempCountryData.country = tempCountryData.province;
              tempCountryData.province = null;
            }
            cleanedCountriesData.push(tempCountryData);
  
        }
        else if (countryName == 'china' || countryName == 'australia' || countryName == 'canada') {
            // Countries with provinces/states
            // We'll add all provinces into one.
            tempCountryData = rawCountryData;
            tempCountryData.province = null;
  
            var foundAndAppended = false;
            for (var idx = 0; idx < cleanedCountriesData.length; idx++) {
                if (cleanedCountriesData[idx].country === tempCountryData.country) {
  
                    cleanedCountriesData[idx].timeline = addTimelines(cleanedCountriesData[idx].timeline, tempCountryData.timeline);
                    foundAndAppended = true;
                }
            }
            if (!foundAndAppended) {
                cleanedCountriesData.push(tempCountryData)
            }
        }
        else {
            // All other countries
            cleanedCountriesData.push(rawCountryData);
        }
    }
    return cleanedCountriesData;
  }


// Update data to per million
export function calculatePerMillionData(timeline, population, MIN_POPULATION, MIN_PER_MILLION_THRESHOLD) {

    // var populationObject = {};
    // population.forEach(country => populationObject[country[0]]=country[1]);

    var perMillionData = Object.values(timeline);
    // var countryName = countryData.country.toLowerCase();
    
    if (population == undefined || parseInt(population) < parseInt(MIN_POPULATION))
    {
        perMillionData = perMillionData.map(x => x * 0); 
        // console.log('Ignored: ' + countryData.country + ' - ' + countryData.province + ' - ' + population)
    } 
    else {
        perMillionData = perMillionData.map(x => parseFloat((x * 1000000 / population).toFixed(2)) >= MIN_PER_MILLION_THRESHOLD ? parseFloat((x * 1000000 / population).toFixed(2)) : 0 ); 
    }
    return perMillionData;
}

// Adds two timelines
function addTimelines(timeline1, timeline2) {
  var returnTimeline = {};
  
  for (var type of ['cases','deaths','recovered']) {
      var obj = {};
      returnTimeline[type] = {};
      for (var key of Object.keys(timeline1[type])) 
      {
          returnTimeline[type][key] = timeline1[type][key] + timeline2[type][key];
      }
  }
  return (returnTimeline);
}

