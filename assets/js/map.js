window.onload=function(){
  var map = L.map('map').setView([47.12, -1.40], 11);

  L.tileLayer('http://{s}.tiles.mapbox.com/v3/examples.map-20v6611k/{z}/{x}/{y}.png', {
    opacity: 0.5,
    maxZoom: 19
  }).addTo(map);

  L.tileLayer('http://{s}.tiles.cg44.makina-corpus.net/tiles/{z}/{x}/{y}.png', {
    continuousWorld: true,  // very important
    tms: true,
    maxZoom: 19
  }).addTo(map);

  L.control.scale().addTo(map);

  var osmGeocoder = new L.Control.OSMGeocoder();
  map.addControl(osmGeocoder);
}