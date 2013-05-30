window.onload=function(){

  // #################
  // Leaflet hash
  // #################

var HAS_HASHCHANGE = (function() {
    var doc_mode = window.documentMode;
    return ('onhashchange' in window) &&
      (doc_mode === undefined || doc_mode > 7);
  })();

  L.Hash = function(map) {
    this.onHashChange = L.Util.bind(this.onHashChange, this);

    if (map) {
      this.init(map);
    }
  };

  L.Hash.prototype = {
    map: null,
    lastHash: null,

    parseHash: function(hash) {
      if(hash.indexOf('#') === 0) {
        hash = hash.substr(1);
      }
      var args = hash.split("/");
      if (args.length == 3) {
        var zoom = parseInt(args[0], 10),
        lat = parseFloat(args[1]),
        lon = parseFloat(args[2]);
        if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
          return false;
        } else {
          return {
            center: new L.LatLng(lat, lon),
            zoom: zoom
          };
        }
      } else {
        return false;
      }
    },

    formatHash: function(map) {
      var center = map.getCenter(),
          zoom = map.getZoom(),
          precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

      return "#" + [zoom,
        center.lat.toFixed(precision),
        center.lng.toFixed(precision)
      ].join("/");
    },

    init: function(map) {
      this.map = map;

      // reset the hash
      this.lastHash = null;
      this.onHashChange();

      if (!this.isListening) {
        this.startListening();
      }
    },

    remove: function() {
      if (this.changeTimeout) {
        clearTimeout(this.changeTimeout);
      }

      if (this.isListening) {
        this.stopListening();
      }

      this.map = null;
    },

    onMapMove: function() {
      // bail if we're moving the map (updating from a hash),
      // or if the map is not yet loaded

      if (this.movingMap || !this.map._loaded) {
        return false;
      }

      var hash = this.formatHash(this.map);
      if (this.lastHash != hash) {
        location.replace(hash);
        this.lastHash = hash;
      }
    },

    movingMap: false,
    update: function() {
      var hash = location.hash;
      if (hash === this.lastHash) {
        return;
      }
      var parsed = this.parseHash(hash);
      if (parsed) {
        this.movingMap = true;

        this.map.setView(parsed.center, parsed.zoom);

        this.movingMap = false;
      } else {
        this.onMapMove(this.map);
      }
    },

    // defer hash change updates every 100ms
    changeDefer: 100,
    changeTimeout: null,
    onHashChange: function() {
      // throttle calls to update() so that they only happen every
      // `changeDefer` ms
      if (!this.changeTimeout) {
        var that = this;
        this.changeTimeout = setTimeout(function() {
          that.update();
          that.changeTimeout = null;
        }, this.changeDefer);
      }
    },

    isListening: false,
    hashChangeInterval: null,
    startListening: function() {
      this.map.on("moveend", this.onMapMove, this);

      if (HAS_HASHCHANGE) {
        L.DomEvent.addListener(window, "hashchange", this.onHashChange);
      } else {
        clearInterval(this.hashChangeInterval);
        this.hashChangeInterval = setInterval(this.onHashChange, 50);
      }
      this.isListening = true;
    },

    stopListening: function() {
      this.map.off("moveend", this.onMapMove, this);

      if (HAS_HASHCHANGE) {
        L.DomEvent.removeListener(window, "hashchange", this.onHashChange);
      } else {
        clearInterval(this.hashChangeInterval);
      }
      this.isListening = false;
    }
  };
  L.hash = function(map) {
    return new L.Hash(map);
  };
  L.Map.prototype.addHash = function() {
    this._hash = L.hash(this);
  };
  L.Map.prototype.removeHash = function() {
    this._hash.remove();
  };

  // ############################
  // Ortho 44 specific geocoding
  // ############################

  var Ortho44 = {
    _callbackIndex: 0,

    bindGeocode: function(form, input, map, bounds, callback) {
      L.DomEvent.addListener(form, 'submit', this._geocode, this);
      this._map = map;
      this._input = input;
      this._callback = callback;
      // Restrict to Loire-Atlantique
      this._bounds = bounds;
    },

    _geocode: function (event) {
      L.DomEvent.preventDefault(event);
      //http://wiki.openstreetmap.org/wiki/Nominatim
      var callbackId = "_l_ortho44geocoder_" + (this._callbackIndex++);
      window[callbackId] = L.Util.bind(this._callback, this);

      /* Set up params to send to Nominatim */
      var params = {
        // Defaults
        q: this._input.value,
        json_callback : callbackId,
        format: 'json'
      };

      if( this._bounds instanceof L.LatLngBounds ) {
        params.viewbox = this._bounds.toBBoxString();
        params.bounded = 1;
      } else {
        console.log('bounds must be of type L.LatLngBounds');
        return;
      }

      var url = "http://nominatim.openstreetmap.org/search" + L.Util.getParamString(params);
      var script = document.createElement("script");

      script.type = "text/javascript";
      script.src = url;
      script.id = callbackId;
      document.getElementsByTagName("head")[0].appendChild(script);
    }
  };

  // #############
  //  MAP INIT
  // #############

  var max_bounds_address = new L.LatLngBounds(new L.LatLng(46.86008, -2.55754), new L.LatLng(47.83486, -0.92346));
  var max_bounds = new L.LatLngBounds(new L.LatLng(46.8, -3.0), new L.LatLng(48.0, -0.5));
  var map = L.map('map',
      {
        'maxBounds': max_bounds,
      }
    ).setView([47.21806, -1.55278], 11);

  map.attributionControl.setPrefix('Réalisé par <a href="http://www.makina-corpus.com">Makina Corpus</a>');

/*var streets = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {
    opacity: 0.5,
    maxZoom: 18,
    attribution: "MapQuest / OpenStreetMap",
    subdomains: '1234'
  }); //.addTo(map); */

  var ortho2012 = L.tileLayer('http://{s}.tiles.cg44.makina-corpus.net/ortho2012/{z}/{x}/{y}.jpg', {
    continuousWorld: true,  // very important
    tms: true,
    maxZoom: 18,
    subdomains: "abcdefgh",
    attribution: "Source: Département de Loire-Atlantique"
  }).addTo(map);

  L.geoJson(loire_atlantique_buffer_json, {
    style: function (feature) {
        return {
          fillColor: "#2ba6cb",
          fillOpacity: 1,
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          };
    }
  }).addTo(map);

  var streets = L.tileLayer('http://{s}.tiles.mapbox.com/v3/examples.map-20v6611k/{z}/{x}/{y}.png', {
    opacity: 0.5,
    maxZoom: 18,
    attribution: "OpenStreetMap"
  }); //.addTo(map);

  var baseMaps = {};
  var overlayMaps = {
    "Rues": streets
  };
  L.control.layers(baseMaps, overlayMaps).addTo(map);

  L.control.scale().addTo(map);

  Ortho44.bindGeocode(
    document.getElementById('search-address'),
    document.getElementById("search-input"),
    map,
    max_bounds_address,
    function (results) {
      console.log(results);
      if(results.length > 0) {
        var bbox = results[0].boundingbox,
          first = new L.LatLng(bbox[0], bbox[2]),
          second = new L.LatLng(bbox[1], bbox[3]),
          bounds = new L.LatLngBounds([first, second]);
        Ortho44._map.fitBounds(bounds);
      }
    });
  map.locate({setView: true});
  map.on('locationerror', function() {
    console.log("Too far away, keep default location");
  });

  var hash = new L.Hash(map);
}