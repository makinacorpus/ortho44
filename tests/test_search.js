//==============================================================================
// Casper generated Thu May 30 2013 20:21:00 GMT+0200 (CEST)
//==============================================================================

var x = require('casper').selectXPath;

var start_url = casper.cli.options['start'];

casper.options.viewportSize = {width: 1301, height: 682};
casper.start(start_url);
casper.waitForSelector("form#search-address input[name='search']",
    function success() {
        this.test.assertExists("form#search-address input[name='search']");
        this.fill("form#search-address", {'search': "saint nazaire"}, true);
    },
    function fail() {
        this.test.assertExists("form#search-address input[name='search']");
});

casper.waitForSelector(".search-success", function() {
    this.test.assertUrlMatch(/^http:.+#12\/47\.27\d+\/-2\.24\d+$/);
    this.test.assertExists("img[src$='ortho2012/12/2022/2659.jpg']");
});

casper.run(function() {
    this.test.done();
});