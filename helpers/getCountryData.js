
// const csv = require('csv-parser');
const fs = require('fs');
const https = require('https');
const request = require('request');

if (fs.existsSync('../data/countries-population.csv')) fs.unlinkSync('../data/countries-population.csv');

async function process() { 
  
  const req = await downloadPage('https://corona.lmao.ninja/v2/historical');
  
  // console.log(req);
  // for(let country of JSON.parse(req).) { 
  JSON.parse(req).forEach( country => {
    var requestCountry = country.country;
    var requestProvince = country.province;
    
    if ((country.country == 'france' || country.country == 'uk' || country.country == 'denmark' || country.country == 'netherlands') && country.province) {
      requestCountry = country.province;
      requestProvince = null;
    }
    
    if (requestProvince) {
      console.log(requestCountry + ' ' + requestProvince);
    }
    // console.log(requestCountry);
    https.get('https://restcountries.eu/rest/v2/name/' + requestCountry, (resp) => {
    let data = '';
    
    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });
    
    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      // console.log(country);
      // console.log(JSON.stringify(resp.getHeaders()));
      
      if (Array.isArray(JSON.parse(data)) ) {
        //fs.writeFileSync(JSON.parse(data)[0].name + '.json', data);
        var pop = JSON.parse(data)[0].population;
        if (requestCountry == 'india') pop = 1339000000;
        
        // if (country.province) console.log('Country: ' + country.country + ' - province: ' + country.province + ' - Pop: ' + pop);
        
        fs.appendFileSync('../data/countries-population.csv', requestCountry + ',' + pop + '\n');
        
      } else {
        console.log('**** NO **** -> ' + requestCountry);
      }
    });
    
    
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
});
}

process();

// wrap a request in an promise
function downloadPage(url) {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (error) reject(error);
      if (response.statusCode != 200) {
        reject('Invalid status code <' + response.statusCode + '>');
      }
      resolve(body);
    });
  });
}

