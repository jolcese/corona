import population from '../data/countries-population.csv'

// Merge countries with provinces and separate colonies
export function cleanupCountriesData(rawCountriesData, start, end) {

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
          tempCountryData.timeline = sliceTimeline(tempCountryData.timeline, start, end);
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

                cleanedCountriesData[idx].timeline = addTimelines(cleanedCountriesData[idx].timeline, sliceTimeline(tempCountryData.timeline, start, end));

                  foundAndAppended = true;
              }
          }
          if (!foundAndAppended) {
              rawCountryData.timeline = sliceTimeline(rawCountryData.timeline, start, end);
              cleanedCountriesData.push(tempCountryData)
          }
      }
      else {
          // All other countries
          rawCountryData.timeline = sliceTimeline(rawCountryData.timeline, start, end);
          cleanedCountriesData.push(rawCountryData);
      }
  }
  return cleanedCountriesData;
}

// Update data to per million
export function calculatePerMillionData(countryData, timelineType, CASE_MILLION_MIN_POPULATION, MIN_VALUE_PER_MILLION) {

    var populationObject = {};
  population.forEach(country => populationObject[country[0]]=country[1]);

  var perMillionData = Object.values(countryData.timeline[timelineType]);
  var countryName = countryData.country.toLowerCase();
  
  if ((countryData.province !== null && countryData.province != countryData.country ) || populationObject[countryName] == undefined || parseInt(populationObject[countryName]) < parseInt(CASE_MILLION_MIN_POPULATION))
  {
      perMillionData = perMillionData.map(x => x * 0); 
      // console.log('Ignored: ' + country.country + ' - ' + country.province + ' - ' + populationObject[countryname])
  } 
  else {
      perMillionData = perMillionData.map(x => parseFloat((x * 1000000 / populationObject[countryName]).toFixed(2)) >= MIN_VALUE_PER_MILLION ? parseFloat((x * 1000000 / populationObject[countryName]).toFixed(2)) : 0 ); 
  }
  return perMillionData;
}

// Returs a subset of a timeline
function sliceTimeline(timeline, start, end) {

  var returnTimeline = {};
  
  for (var type of ['cases','deaths','recovered']) {
      var obj = {};
      var idx = 0;
      for (var key of Object.keys(timeline[type])) 
      {
          if (start <= idx && end >= idx) obj[key] = timeline[type][key];
          idx++;
      }
      returnTimeline[type] = obj;
  }
  return (returnTimeline);
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

