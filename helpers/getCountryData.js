
// const csv = require('csv-parser');
const fs = require('fs');
const request = require('request');

if (fs.existsSync('./data/countries-population.csv')) fs.unlinkSync('./data/countries-population.csv');

var counter = 0;
var countriesResult = {};

new Promise((resolve, reject) => {
  request('https://corona.lmao.ninja/v2/historical', (error, response, body) => {
    if (error) reject(error);
    if (response.statusCode != 200) {
      reject('Invalid status code <' + response.statusCode + '>');
    }
    resolve(body);
  });
}).then (function(value) {
  processCountries(value);
})

function processCountries(req) {
  var countries = [];
  
  JSON.parse(req).forEach( country => {
    var requestCountry = country.country;
    var requestProvince = country.province;
    
    if ((country.country == 'France' || country.country == 'UK' || country.country == 'Denmark' || country.country == 'Netherlands') && country.province) {
      requestCountry = country.province;
      requestProvince = null;
    }
    
    countries.push(requestCountry);
  });

  var promises = countries.map(country => new Promise(resolve => {

    var url = 'https://restcountries.eu/rest/v2/name/' + country;

    request(url, {
      json: true
    }, (err, res) => {
      if (err) {
        console.log(counter++ + ' **** ERROR -> ' + country);
      } 
      resolve (res.body)
    });
  }).then (function (response) {
    if (Array.isArray(response) ) {
      //fs.writeFileSync(JSON.parse(data)[0].name + '.json', data);

      var pop = response[0].population;
      var region = response[0].region;
      if (country.toLowerCase() == 'india') pop = 1339000000;
      
      console.log(counter++ + ' Country: ' + country + ' - Pop: ' + pop);
      
      countriesResult[country.toLowerCase()] = {
        population: pop, 
        continent: region
      }
    } else {
      console.log(counter++ + ' **** NO DATA -> ' + country);
    }
  })
  
  );

  Promise.all(promises).then(results => {

    Object.keys(countriesResult).sort().forEach( country => {
      fs.appendFileSync('./data/countries-data.csv', '"' + country.toLowerCase() + '",' + countriesResult[country].population + ',' + countriesResult[country].continent + '\n');
    })
  });
}

