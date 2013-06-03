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
        this.click("form#search-address input[name='search']");
    },
    function fail() {
        this.test.assertExists("form#search-address input[name='search']");
});
casper.waitForSelector("input[name='search']",
    function success() {
        this.test.assertExists("input[name='search']");
        this.evaluate(function enter_search() {
            document.querySelector("input[name='search']").value = "saint nazaire";
        });
    },
    function fail() {
        this.test.assertExists("input[name='search']");
    }
);
casper.waitForSelector("form#search-address input[type=submit][value='Rechercher']",
    function success() {
        this.test.assertExists("form#search-address input[type=submit][value='Rechercher']");
        this.evaluate(function click_search() {
            console.log(document.querySelector("input[name='search']").value);
            document.querySelector("form#search-address input[type=submit][value='Rechercher']").click();
        });
    },
    function fail() {
        this.test.assertExists("form#search-address input[type=submit][value='Rechercher']");
});

casper.waitForSelector(".search-success", function() {
    this.test.assertUrlMatch(/^http:.+#12@47\.27\d+@-2\.24\d+$/);
    this.test.assertExists("img[src$='ortho2012/12/2022/2659.jpg']");
});

casper.run(function() {
    this.test.done();
});