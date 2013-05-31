//==============================================================================
// Casper generated Wed May 22 2013 09:08:42 GMT+0200 (CEST)
//==============================================================================

var x = require('casper').selectXPath;

casper.options.viewportSize = {width: 1615, height: 964};
casper.start('http://makinacorpus.github.io/ortho44/');

casper.waitForSelector(x("//a[normalize-space(text())='Contact']"),
    function success() {
        this.test.assertExists(x("//a[normalize-space(text())='Contact']"));
        this.click(x("//a[normalize-space(text())='Contact']"));
    },
    function fail() {
        this.test.assertExists(x("//a[normalize-space(text())='Contact']"));
});
casper.then(function() {
    this.test.assertUrlMatch(/^http:\/\/makinacorpus.github.io\/ortho44\/contact.html$/);
});

casper.run(function() {
	this.test.done();
});