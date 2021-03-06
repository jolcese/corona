# COVID-19 Statistics

There are a lot of websites with great statistics about progression of the disease but few include per million graphs. This work tries to fill that gap.

This is a sample screenshot ![Alt text](doc/sample.png?raw=true "Screenshot")


## Getting Started



### Prerequisites

`npm install` 

### Installing

You can generate the page with `npm run dev` or `webpack --mode development` 
Then open with your favorite browser

## Running the tests

TBD

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Chart.JS](https://www.chartjs.org/) - Simple yet flexible JavaScript charting for designers & developers
* [webpack](https://webpack.js.org/) - Webpack is a static module bundler for modern JavaScript applications

## Contributing

TBD

## Versioning

We use [SemVer](http://semver.org/) for versioning.

* 0.0.8
  * ~~Add graphs starting at n th case / n th death~~
  * ~~Fix x axis values for n graphs~~
  * ~~Remove data with 0 data for n graphs~~
  * ~~Add per million nth graph~~

* 0.0.7 Minor bug fixes
  * ~~Add continent to data and ability to select~~
* 0.0.6 Refactor into different modules
  * ~~Deduplicate countries array~~
  * ~~Fixed Initialize slider text on load~~
* 0.0.5
  * ~~Address new API option ?lastdays=365 / Reload Data~~
  * ~~Toggle linear/log graph~~
  8 ~~Save values on local storage~~
* 0.0.4 - Adding more controls
  * ~~Add slider for minimum population for per million graphs~~
  * ~~Per million graphs starting at >1~~
  * ~~Less decimals~~
  * ~~Initialize slider text on load~~
* 0.0.3 - Cleanup README.md. Sliders Spacing.
  * ~~Fix adding provinces for China, Australia & Canada~~
  * ~~Add slider for dates~~
* 0.0.2 - Fixed incorrect data due to changes in source names. Added readme.md. Added License
  * ~~Fix Readme (version)~~
  * ~~Add reference to source data~~
* 0.0.1 - Initial version

## TO DO
* Highlight (black) line when overing
* Remove access to local storage on getSourceData
* processData should receive Data object
* Fix grapth title for n graphs
* Fix min Y for cases 4 & 8
* Fix max X for cases n graph (max is calculated before limiting # of graphs)
* Fix lowercase

## Authors

* **Jose Olcese** - *Initial work* - [jolcese](https://github.com/jolcese)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Disease data is based on [NovelCOVID API](https://github.com/novelcovid/api)
* Population data is based on [REST Countries](https://restcountries.eu)
