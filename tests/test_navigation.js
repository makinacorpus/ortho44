//==============================================================================
// Casper generated Wed May 22 2013 09:08:42 GMT+0200 (CEST)
//==============================================================================

var x = require('casper').selectXPath;
var casper = require('casper').create();
casper.options.viewportSize = {width: 1615, height: 964};
casper.start('http://makinacorpus.github.io/ortho44/');

casper.waitForSelector(x("//a[normalize-space(text())='Démonstration']"),
    function success() {
        this.test.assertExists(x("//a[normalize-space(text())='Démonstration']"));
        this.click(x("//a[normalize-space(text())='Démonstration']"));
    },
    function fail() {
        this.test.assertExists(x("//a[normalize-space(text())='Démonstration']"));
});
casper.then(function() {
    this.test.assertUrlMatch(/^http:\/\/makinacorpus.github.io\/ortho44\/dem.htm$/);
});

casper.run(function() {this.test.renderResults(true);});