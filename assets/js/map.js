window.onload=function(){
var mapl = L.map('map-l').setView([47.12, -1.40], 10);
var mapr = L.map('map-r').setView([47.12, -1.40], 10);

L.tileLayer('http://a.tiles.mapbox.com/v3/examples.map-a1dcgmtr/{z}/{x}/{y}.png', {
  maxZoom: 16
}).addTo(mapl)

L.tileLayer('http://a.tiles.mapbox.com/v3/examples.map-20v6611k/{z}/{x}/{y}.png', {
  maxZoom: 16
}).addTo(mapr);

L.control.scale().addTo(mapl).addTo(mapr);

var osmGeocoder = new L.Control.OSMGeocoder();
mapr.addControl(osmGeocoder);

var cursorl = L.circleMarker([0,0], {radius:20, fillOpacity: 0.2, color: '#ff0', fillColor: '#fff'}).addTo(mapl);
var cursorr = L.circleMarker([0,0], {radius:20, fillOpacity: 0.2, color: '#ff0', fillColor: '#fff'}).addTo(mapr);

mapl.on('mousemove', function (e) {
   cursorl.setLatLng(e.latlng);
   cursorr.setLatLng(e.latlng);
});
mapr.on('mousemove', function (e) {
   cursorl.setLatLng(e.latlng);
   cursorr.setLatLng(e.latlng);
});

var updatel = function () {mapl.setView(mapr.getCenter(), mapr.getZoom());};
var updater = function () {mapr.setView(mapl.getCenter(), mapl.getZoom());};
mapl.on('move zoom', function (e) {
   mapr.off('move zoom');
   updater();
   mapr.on('move zoom', updatel);
});
mapr.on('move zoom', function (e) {
       mapl.off('move zoom');
   updatel();
   mapl.on('move zoom', updatel);
});
}