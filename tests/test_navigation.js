//==============================================================================
// Casper generated Wed May 22 2013 09:08:42 GMT+0200 (CEST)
//==============================================================================

var x = require('casper').selectXPath;

var start_url = casper.cli.options['start'];

casper.options.viewportSize = {width: 1615, height: 964};
casper.start(start_url);

casper.waitForSelector(x("//a[normalize-space(text())='Contact']"),
    function success() {
        this.test.assertExists(x("//a[normalize-space(text())='Contact']"));
        this.click(x("//a[normalize-space(text())='Contact']"));
    },
    function fail() {
        this.test.assertExists(x("//a[normalize-space(text())='Contact']"));
});
casper.then(function() {
    this.test.assertUrlMatch(/^http:\/\/.+\/contact.html$/);
});

casper.run(function() {
	this.test.done(2);
});