//==============================================================================
// Casper generated Thu May 30 2013 20:21:00 GMT+0200 (CEST)
//==============================================================================

var x = require('casper').selectXPath;

var start_url = casper.cli.options['start'];

casper.options.viewportSize = {width: 1301, height: 682};
casper.start(start_url + "#14/47.4596/-1.9028");
casper.waitForSelector(".search-ready",
    function success() {
        this.test.assertExists("form#search-address input[name='search']", "Search is visible");
        this.sendKeys("form#search-address input[name='search']", "saint nazaire");
        this.evaluate(function(){
        	document.querySelector("form#search-address #search-button").click();
        });
    },
    function fail() {
        this.test.assertExists("form#search-address input[name='search']", "Search is invisible");
});

casper.waitForSelector(".search-success", function success() {
    this.test.assertUrlMatch(/^http:.+#12\/47\.27\d+\/-2\.24\d+$/, "Search is working");
    this.test.assertExists("img[src$='ortho-2012/12/2022/2659.png']");
});

casper.run(function() {
    this.test.done();
});