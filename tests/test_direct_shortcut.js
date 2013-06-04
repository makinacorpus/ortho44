//==============================================================================
// Casper generated Thu May 30 2013 20:21:00 GMT+0200 (CEST)
//==============================================================================

var x = require('casper').selectXPath;

var start_url = casper.cli.options['start'];

casper.options.viewportSize = {width: 1301, height: 682};
casper.start(start_url + "#12/47.2766/-2.2453");

casper.waitForSelector(".map-initialized", function() {
    this.test.assertExists("img[src$='ortho2012/12/2022/2659.jpg']");
});

casper.run(function() {
    this.test.done();
});