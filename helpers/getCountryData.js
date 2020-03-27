
const csv = require('csv-parser');
const fs = require('fs');
const https = require('https');

if (fs.existsSync('countries-population.csv')) fs.unlinkSync('countries-population.csv');

fs.createReadStream('countries.csv')
  .pipe(csv())
  .on('data', (row) => {
    // console.log(row);


    
    https.get('https://restcountries.eu/rest/v2/name/' + row.country, (resp) => {
      let data = '';
    
      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });
    
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        // console.log(row);
        // console.log(JSON.stringify(resp.getHeaders()));

        if (Array.isArray(JSON.parse(data)) ) {
          fs.writeFileSync(JSON.parse(data)[0].name + '.json', data);

          var pop = JSON.parse(data)[0].population;
          if (row.country == 'india') pop = 1339000000;

          fs.appendFileSync('countries-population.csv', row.country + ',' + JSON.parse(data)[0].population + '\n');

        } else {
          console.log(row);
        }
      });
    

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });
