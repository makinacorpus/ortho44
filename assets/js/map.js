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
      this._callback = callback;

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
        if(this._callback) this._callback();

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
  // Screenshot
  // ############################
  L.Control.Screenshot = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
        position: 'topleft',
        title: 'Screenshot'
    },

    screenshot: function () {
        Ortho44.fadeOut("#overlay", 40, function() {
          var page = location.href;
          var screamshot = "http://screamshot.makina-corpus.net/capture/?render=html&waitfor=.map-initialized&url=";
          window.open(screamshot + encodeURIComponent(page));
        });
    },

    onAdd: function(map) {
        this.map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-zoom leaflet-control');
        var div = L.DomUtil.create('div', 'leaflet-bar', this._container);
        var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-screenshot-control', div);
        link.href = '#';
        link.title = this.options.title;
        var span = L.DomUtil.create('span', 'icon-print', link);

        L.DomEvent
            .addListener(link, 'click', L.DomEvent.stopPropagation)
            .addListener(link, 'click', L.DomEvent.preventDefault)
            .addListener(link, 'click', this.screenshot, this);
        return this._container;
    }
  });
  L.control.screenshot = function(map) {
    return new L.Control.Screenshot(map);
  };

  // ############################
  // Social buttons
  // ############################
  L.Control.Social = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
        position: 'bottomleft',
        title: 'Social networks',
        text: "VuDuCiel Loire-Atlantique",
        links: [
          ['facebook', "Facebook", "https://www.facebook.com/sharer.php?u=_url_&t=_text_"],
          ['twitter', "Twitter", "http://twitter.com/intent/tweet?text=_text_&url=_url_"],
          ['google-plus', "Google Plus", "https://plus.google.com/share?url=_url_"]
        ]
    },

    share: function () {
      var url = this.link;
      url = url.replace(/_text_/, encodeURIComponent(this.self.options.text));
      url = url.replace(/_url_/, encodeURIComponent(location.href));
      window.open(url);
    },

    onAdd: function(map) {
        this.map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control');
        for (var i = 0; i < this.options.links.length; i++) {
          infos = this.options.links[i];
          var div = L.DomUtil.create('div', 'leaflet-social-control', this._container);
          var link = L.DomUtil.create('a', 'leaflet-social-control-'+infos[0], div);
          link.href = infos[2];
          link.title = infos[1];
          var span = L.DomUtil.create('span', 'icon-'+infos[0]+'-sign', link);

          L.DomEvent
              .addListener(link, 'click', L.DomEvent.stopPropagation)
              .addListener(link, 'click', L.DomEvent.preventDefault)
              .addListener(link, 'click', this.share, {self: this, link: infos[2]});
        };
        
        return this._container;
    }
  });
  L.control.social = function(map) {
    return new L.Control.Social(map);
  };

  // ############################
  // Snippet
  // ############################
  L.Control.Snippet = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
        position: 'topleft',
        title: 'Snippet'
    },

    generate: function() {
      var center = this.map.getCenter(),
          zoom = this.map.getZoom(),
          precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

      script = document.querySelector("#snippet #snippet-template").innerText;
      script = script.replace(/_zoom_/, zoom);
      script = script.replace(/_lat_/, center.lat.toFixed(precision));
      script = script.replace(/_lon_/, center.lng.toFixed(precision));
      document.querySelector("#snippet #snippet-code").innerText = script;
    },
    onAdd: function(map) {
        this.map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-zoom leaflet-control');
        var div = L.DomUtil.create('div', 'leaflet-bar', this._container);
        var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-snippet-control', div);
        link.href = '#';
        link.title = this.options.title;
        link.setAttribute("data-reveal-id", "snippet");
        var span = L.DomUtil.create('span', 'icon-code', link);

        L.DomEvent
        //     .addListener(link, 'click', L.DomEvent.stopPropagation)
        //     .addListener(link, 'click', L.DomEvent.preventDefault)
             .addListener(link, 'click', this.generate , this);

        return this._container;
    }
  });
  L.control.snippet = function(map) {
    return new L.Control.Snippet(map);
  };

  // ############################
  // Locator
  // ############################
  L.Control.Locator = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
        position: 'topleft',
        title: 'Localisation'
    },

    locate: function() {
      this.map.locate();
    },
    onAdd: function(map) {
        this.map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-zoom leaflet-control');
        var div = L.DomUtil.create('div', 'leaflet-bar', this._container);
        var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-locate-control', div);
        link.href = '#';
        link.title = this.options.title;
        link.setAttribute("data-reveal-id", "snippet");
        var span = L.DomUtil.create('span', 'icon-screenshot', link);

        L.DomEvent
             .addListener(link, 'click', L.DomEvent.stopPropagation)
             .addListener(link, 'click', L.DomEvent.preventDefault)
             .addListener(link, 'click', this.locate , this);

        return this._container;
    }
  });
  L.control.locator = function(map) {
    return new L.Control.Locator(map);
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

    fadeOut: function(selector, interval, callback) {
      document.querySelector(selector).style.display="block";
      var opacity = 9;

      function func() {
          document.querySelector(selector).style.opacity = "0." + opacity;
          opacity--;

          if (opacity == -1) {
            window.clearInterval(fading);
            document.querySelector(selector).style.display="none";
            if(callback) callback();
          }
      }

      var fading = window.setInterval(func, interval);
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

  map.attributionControl.setPrefix('');

  var ortho2012 = L.tileLayer('http://{s}.tiles.cg44.makina-corpus.net/ortho2012/{z}/{x}/{y}.jpg', {
    continuousWorld: true,  // very important
    tms: true,
    maxZoom: 18,
    subdomains: "abcdefgh",
    attribution: "Source: Département de Loire-Atlantique"
  }).addTo(map);
  ortho2012.on('load', function() {
    // wait for progressive jpeg to render
    window.setTimeout(function() {
      Ortho44.setClass(document.querySelector('body'), "map-initialized");
    }, 500);
  })

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
    "Afficher les rues": streets_mapquest
  };
  L.control.layers(baseMaps, overlayMaps).addTo(map);

  L.control.scale({'imperial': false}).addTo(map);
  (new L.Control.ZoomFS()).addTo(map); 
  L.control.screenshot().addTo(map);
  L.control.social().addTo(map);
  L.control.snippet().addTo(map);
  L.control.locator().addTo(map);

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
    var hash = new L.Hash(map);
  });
  // default view if no hash
  map.setView([47.21806, -1.55278], 11);

  map.on('locationerror', function() {
    console.log("Too far away, keep default location");
  });

  $(document).foundation(null, null, null, null, true);

}