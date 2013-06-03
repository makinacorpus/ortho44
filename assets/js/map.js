window.onload=function(){

  /*
   * L.Control.ZoomFS - default Leaflet.Zoom control with an added fullscreen button
   * built to work with Leaflet version 0.5
   * https://github.com/elidupuis/leaflet.zoomfs
   */
  L.Control.ZoomFS = L.Control.Zoom.extend({
    includes: L.Mixin.Events,
    onAdd: function (map) {
      var zoomName = 'leaflet-control-zoom',
          barName = 'leaflet-bar',
          partName = barName + '-part',
          container = L.DomUtil.create('div', zoomName + ' ' + barName);

      this._map = map;
      this._isFullscreen = false;

      this._zoomFullScreenButton = this._createButton('<span class="icon-fullscreen"></span>','Full Screen',
              'leaflet-control-fullscreen ' +
              partName + ' ' +
              partName + '-top',
              container, this.fullscreen, this);

      this._zoomInButton = this._createButton('+', 'Zoom in',
              zoomName + '-in ' +
              partName + ' ',
              container, this._zoomIn,  this);

      this._zoomOutButton = this._createButton('-', 'Zoom out',
              zoomName + '-out ' +
              partName + ' ' +
              partName + '-bottom',
              container, this._zoomOut, this);

      map.on('zoomend zoomlevelschange', this._updateDisabled, this);

      return container;

    },
    fullscreen: function() {
      // call appropriate internal function
      if (!this._isFullscreen) {
        this._enterFullScreen();
      } else {
        this._exitFullScreen();
      }

      // force internal resize
      this._map.invalidateSize();
    },
    _enterFullScreen: function() {
      var container = this._map._container;

      // apply our fullscreen settings
      container.style.position = 'fixed';
      container.style.left = 0;
      container.style.top = 0;
      container.style.width = '100%';
      container.style.height = '100%';

      // store state
      L.DomUtil.addClass(container, 'leaflet-fullscreen');
      this._isFullscreen = true;

      // add ESC listener
      L.DomEvent.addListener(document, 'keyup', this._onKeyUp, this);

      // fire fullscreen event on map
      this._map.fire('enterFullscreen');
    },
    _exitFullScreen: function() {
      var container = this._map._container;

      // update state
      L.DomUtil.removeClass(container, 'leaflet-fullscreen');
      this._isFullscreen = false;

      // remove fullscreen style; make sure we're still position relative for Leaflet core.
      container.removeAttribute('style');

      // re-apply position:relative; if user does not have it.
      var position = L.DomUtil.getStyle(container, 'position');
      if (position !== 'absolute' && position !== 'relative') {
        container.style.position = 'relative';
      }

      // remove ESC listener
      L.DomEvent.removeListener(document, 'keyup', this._onKeyUp);

      // fire fullscreen event
      this._map.fire('exitFullscreen');
    },
    _onKeyUp: function(e) {
      if (!e) e = window.event;
      if (e.keyCode === 27 && this._isFullscreen === true) {
        this._exitFullScreen();
      }
    }
  });

  // #################
  // Leaflet hash
  // #################

var HAS_HASHCHANGE = (function() {
    var doc_mode = window.documentMode;
    return ('onhashchange' in window) &&
      (doc_mode === undefined || doc_mode > 7);
  })();

  L.Hash = function(map, callback) {
    this.onHashChange = L.Util.bind(this.onHashChange, this);

    if (map) {
      this.init(map, callback);
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

    init: function(map, callback) {
      this.map = map;
      this._callback = callback

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
        console.log(hash);
        this._callback();

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

  // ###################################
  // Ortho 44 specific geocoding & utils
  // ###################################

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
    },

    setClass: function (element, cl) {
      var classes = element.className,
          pattern = new RegExp( cl );
          hasClass = pattern.test( classes );
      classes = hasClass ? classes : classes + ' ' + cl;
      element.className = classes.trim()
    },
    removeClass: function (element, cl) {
      var classes = element.className,
          pattern = new RegExp( cl );
          hasClass = pattern.test( classes );
      classes = hasClass ? classes.replace( pattern, '' ) : classes;
      element.className = classes.trim()
    },

    showSocialButtons: function() {

      var html =
                '<div id="social-buttons" class="fade">'
              + '<div class="fb-like" data-href="YOUR_URL" data-send="true" data-layout="box_count" data-width="50" data-show-faces="true" data-colorscheme="dark"></div>'
              + '<div class="g-plusone-frame"><div class="g-plusone" data-size="tall" data-href="YOUR_URL"></div></div>'
              + '<a href="https://twitter.com/share" class="twitter-share-button" data-url="YOUR_URL" data-text="VuDuCiel Loire-Atlantique" data-count="vertical">Tweet</a>'
              + '<div id="fb-root"></div>'
              + '</div>';
      document.getElementById( 'social-buttons-container' ).insertAdjacentHTML( 'beforeEnd', html );

      var script = document.createElement( 'script' );
      script.async = true;
      script.src = document.location.protocol + '//connect.facebook.net/en_US/all.js#xfbml=1&appId=YOUR_FB_APP_ID';
      document.getElementById( 'fb-root' ).appendChild( script );

      script = document.createElement( 'script' );
      script.async = true;
      script.src = document.location.protocol + '//platform.twitter.com/widgets.js';
      document.getElementById( 'social-buttons' ).appendChild( script );

      script = document.createElement( 'script' );
      script.async = true;
      script.src = document.location.protocol + '//apis.google.com/js/plusone.js';
      document.getElementById( 'social-buttons' ).appendChild( script );

      window.setTimeout( function () {

          document.getElementById( 'social-buttons' ).removeAttribute( 'class' );

      }, 4000 ); //4 second delay

    },

    updateSocialLink: function() {
      console.log(location.href);
    }

  };

  // #############
  //  MAP INIT
  // #############

  var max_bounds_strict = new L.LatLngBounds(new L.LatLng(46.86008, -2.55754), new L.LatLng(47.83486, -0.92346));
  var max_bounds_buffer = new L.LatLngBounds(new L.LatLng(46.8, -3.0), new L.LatLng(48.0, -0.5));
  var map = L.map('map',
      {
        maxBounds: max_bounds_buffer,
        zoomControl:false
      }
    );

  map.attributionControl.setPrefix('Réalisé par <a href="http://www.makina-corpus.com">Makina Corpus</a>');

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

  /*var streets_mapbox = L.tileLayer('http://{s}.tiles.mapbox.com/v3/examples.map-20v6611k/{z}/{x}/{y}.png', {
    opacity: 0.5,
    maxZoom: 18,
    attribution: "OpenStreetMap"
  }); //.addTo(map); */
  var streets_mapquest = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {
    opacity: 0.5,
    maxZoom: 18,
    attribution: "MapQuest / OpenStreetMap",
    subdomains: '1234'
  }); //.addTo(map); 

  var baseMaps = {};
  var overlayMaps = {
    //"Rues (test)": streets_mapbox,
    "Rues": streets_mapquest
  };
  L.control.layers(baseMaps, overlayMaps).addTo(map);

  L.control.scale().addTo(map);
  var zoomFS = new L.Control.ZoomFS(); 
  map.addControl(zoomFS);

  Ortho44.bindGeocode(
    document.getElementById('search-address'),
    document.getElementById("search-input"),
    map,
    max_bounds_strict,
    function (results) {
      if(results.length > 0) {
        Ortho44.setClass(document.getElementById('search-address'), "search-success");
        Ortho44.removeClass(document.getElementById('search-address'), "search-no-result");
        var bbox = results[0].boundingbox,
          first = new L.LatLng(bbox[0], bbox[2]),
          second = new L.LatLng(bbox[1], bbox[3]),
          bounds = new L.LatLngBounds([first, second]);
        Ortho44._map.fitBounds(bounds);
      } else {
        Ortho44.setClass(document.getElementById('search-address'), "search-no-result");
        Ortho44.removeClass(document.getElementById('search-address'), "search-success");
      }
    });

  map.on('load', function() {
    var hash = new L.Hash(map, Ortho44.updateSocialLink);
    Ortho44.setClass(document.querySelector('body'), "map-initialized");
  });
  map.setView([47.21806, -1.55278], 11);

  map.locate({setView: true});
  map.on('locationerror', function() {
    console.log("Too far away, keep default location");
  });

  // #############
  //  MISC INIT
  // #############

  //Ortho44.showSocialButtons();
}