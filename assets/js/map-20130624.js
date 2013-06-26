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

      this._zoomFullScreenButton = this._createButton('<span class="icon-fullscreen"></span>','Affichage plein écran',
              'leaflet-control-fullscreen ' +
              partName + ' ' +
              partName + '-top',
              container, this.fullscreen, this);

      this._zoomInButton = this._createButton('+', 'Zoom avant',
              zoomName + '-in ' +
              partName + ' ',
              container, this._zoomIn,  this);

      this._zoomOutButton = this._createButton('-', 'Zoom arrière',
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
        position: 'bottomright',
        title: 'Impression'
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
  // Image download
  // ############################
  L.Control.ImageDownload = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
      position: 'bottomright',
      title: "Extraire l'image"
    },

    projectToL93: function(x, y) {
      var p = new Proj4js.Point(x, y);
      Proj4js.transform(this.source, this.dest, p);
      return [p.x, p.y];
    },

    download: function () {
      var bounds = this.map.getBounds();
      var southwest = this.projectToL93(bounds.getSouthWest().lng, bounds.getSouthWest().lat);
      var northeast = this.projectToL93(bounds.getNorthEast().lng, bounds.getNorthEast().lat);
      var wms = "http://services.vuduciel.loire-atlantique.fr/wms/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&BBOX="+southwest[0]+","+southwest[1]+","+northeast[0]+","+northeast[1]+"&SRS=EPSG:2154&WIDTH=1351&HEIGHT=736&LAYERS=ortho2012&STYLES=&FORMAT=image/png&DPI=96&MAP_RESOLUTION=96&FORMAT_OPTIONS=dpi:96&TRANSPARENT=TRUE";
      var link = document.querySelector("#download-link");
      link.href = wms;
      console.log(wms);
    },

    onAdd: function(map) {
      this.map = map;
      this.source = new Proj4js.Proj('EPSG:4326');
      Proj4js.defs["EPSG:2154"] = '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
      this.dest = new Proj4js.Proj('EPSG:2154');
      this._container = L.DomUtil.create('div', 'leaflet-control-zoom leaflet-control');
      var div = L.DomUtil.create('div', 'leaflet-bar', this._container);
      var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-download-control', div);
      link.href = '#';
      link.title = this.options.title;
      link.setAttribute("data-reveal-id", "download-infos");
      var span = L.DomUtil.create('span', 'icon-camera', link);

      L.DomEvent
        .addListener(link, 'click', this.download, this);
      return this._container;
    }
  });
  L.control.imageDownload = function(map) {
    return new L.Control.ImageDownload(map);
  };

  // ############################
  // WMS link
  // ############################
  L.Control.WMSLink = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
      position: 'bottomright',
      title: "Flux SIG (WMS)"
    },

    display: function () {
      
    },

    onAdd: function(map) {
      this.map = map;
      this._container = L.DomUtil.create('div', 'leaflet-control-zoom leaflet-control');
      var div = L.DomUtil.create('div', 'leaflet-bar', this._container);
      var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-wms-control', div);
      link.href = '#';
      link.title = this.options.title;
      link.setAttribute("data-reveal-id", "wms-infos");
      var span = L.DomUtil.create('span', 'icon-cloud-download', link);

      L.DomEvent
        .addListener(link, 'click', this.display, this);
      return this._container;
    }
  });
  L.control.wmsLink = function(map) {
    return new L.Control.WMSLink(map);
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
          ['facebook', "Partager sur Facebook", "https://www.facebook.com/sharer.php?u=_url_&t=_text_"],
          ['twitter', "Partager sur Twitter", "http://twitter.com/intent/tweet?text=_text_&url=_url_"],
          ['google-plus', "Partager sur Google Plus", "https://plus.google.com/share?url=_url_"]
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
          var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-social-control-'+infos[0], div);
          link.href = infos[2];
          link.title = infos[1];
          var span = L.DomUtil.create('span', 'icon-'+infos[0], link);

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
        position: 'bottomleft',
        title: 'Partager sur votre site ou blog'
    },

    generate: function() {
      var center = this.map.getCenter(),
          zoom = this.map.getZoom(),
          precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

      script = document.querySelector("#snippet #snippet-template").textContent;
      script = script.replace(/_zoom_/, zoom);
      script = script.replace(/_lat_/, center.lat.toFixed(precision));
      script = script.replace(/_lon_/, center.lng.toFixed(precision));
      document.querySelector("#snippet #snippet-code").textContent = script;
    },
    onAdd: function(map) {
        this.map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-embed leaflet-control');
        var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single leaflet-snippet-control', this._container);
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
  // ############################
  // WMTS
  // ############################
  /*
   * Copyright (c) 2008-2013 Institut National de l'information Geographique et forestiere France, released under the
   * BSD license.
   */
  L.TileLayer.WMTS = L.TileLayer.extend({

          defaultWmtsParams: {
                  service: 'WMTS',
                  request: 'GetTile',
                  version: '1.0.0',
                  layer: '',
                  style: '',
                  tilematrixSet: '',
                  format: 'image/jpeg'
          },

          initialize: function (url, options) { // (String, Object)
                  this._url = url;
                  var wmtsParams = L.extend({}, this.defaultWmtsParams),
                      tileSize = options.tileSize || this.options.tileSize;
                  if (options.detectRetina && L.Browser.retina) {
                          wmtsParams.width = wmtsParams.height = tileSize * 2;
                  } else {
                          wmtsParams.width = wmtsParams.height = tileSize;
                  }
                  for (var i in options) {
                          // all keys that are not TileLayer options go to WMTS params
                          if (!this.options.hasOwnProperty(i) && i!="matrixIds") {
                                  wmtsParams[i] = options[i];
                          }
                  }
                  this.wmtsParams = wmtsParams;
                  this.matrixIds = options.matrixIds;
                  L.setOptions(this, options);
          },

          onAdd: function (map) {
                  L.TileLayer.prototype.onAdd.call(this, map);
          },

          getTileUrl: function (tilePoint, zoom) { // (Point, Number) -> String
                  var map = this._map;
                  crs = map.options.crs;
                  tileSize = this.options.tileSize;
                  nwPoint = tilePoint.multiplyBy(tileSize);
                  //+/-1 to get in tile
                  nwPoint.x+=1;
                  nwPoint.y-=1; 
                  sePoint = nwPoint.add(new L.Point(tileSize, tileSize)); 
                  nw = crs.project(map.unproject(nwPoint, zoom));
                  se = crs.project(map.unproject(sePoint, zoom));  
                  tilewidth = se.x-nw.x;
                  zoom=map.getZoom();
                  ident = this.matrixIds[zoom].identifier;
                  X0 = this.matrixIds[zoom].topLeftCorner.lng;
                  Y0 = this.matrixIds[zoom].topLeftCorner.lat;
                  tilecol=Math.floor((nw.x-X0)/tilewidth);
                  tilerow=-Math.floor((nw.y-Y0)/tilewidth);
                  url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});
                  return url + L.Util.getParamString(this.wmtsParams, url) + "&tilematrix=" + ident + "&tilerow=" + tilerow +"&tilecol=" + tilecol ;
          },

          setParams: function (params, noRedraw) {
                  L.extend(this.wmtsParams, params);
                  if (!noRedraw) {
                          this.redraw();
                  }
                  return this;
          }
  });

  L.tileLayer.wtms = function (url, options) {
          return new L.TileLayer.WMTS(url, options);
  };
  // ###################################
  // Ortho 44 specific geocoding & utils
  // ###################################

  var Ortho44 = {
    _callbackIndex: 0,

    bindGeocode: function(form, input, map, callback) {
      L.DomEvent.addListener(form, 'submit', this._geocode, this);
      var clearRandom = function() {
        if(this.className == "random-display") {
          this.value = "";
          Ortho44.removeClass(this, "random-display");
        }
      };
      L.DomEvent.addListener(input, 'click', clearRandom, input);
      L.DomEvent.addListener(input, 'focus', clearRandom, input);
      this._map = map;
      this._input = input;
      this._callback = callback;
    },

    _loadElasticSearchJSONP: function (params) {
      var url = "http://elastic.makina-corpus.net/cg44/address/_search" + L.Util.getParamString(params);
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.src = url;
      document.getElementsByTagName("head")[0].appendChild(script);
      document.getElementsByTagName("head")[0].removeChild(script);
    },

    _geocode: function (event) {
      L.DomEvent.preventDefault(event);
      var self = this;
      window._l_ortho44geocoder_namelookup = function(results) {
        if(results.hits.total == 0) {
          window._l_ortho44geocoder_fullsearch = L.Util.bind(self._callback, self);
          /* search any macth */
          self._loadElasticSearchJSONP({q: self._input.value, default_operator:"AND", callback: "_l_ortho44geocoder_fullsearch"});
        } else {
          self._callback(results);
        }
      };

      /* search name only */
      this._loadElasticSearchJSONP({
        source: JSON.stringify({
          query: {
                query_string: {
                    fields: ["nom", "type"],
                    query: this._input.value + " AND COMMUNE",
                    default_operator: "AND"
                }
            }
        }),
        callback : "_l_ortho44geocoder_namelookup"
      });
    },

    _getLabel: function(hit, mode) {
      var label = "";
      if(hit.nom) {
        label = hit.nom;
        if(hit.type && hit.type == "LIEUDIT") {
          label += " (Lieu-dit)"
          if(hit.commune) {
            label += " - <strong>" + hit.commune + "</strong>";
          }
        } else {
          label = "<strong>" + label + "</strong>";
        }
      } else {
        label = (mode == "POPUP" && hit.numero ? hit.numero + ' ':'') + (hit.nom_voie ? hit.nom_voie + ' - ':'') + (hit.nom_ld ? hit.nom_ld + ', ':'') + '<strong>' + (hit.commune ? hit.commune:'') + '</strong>';
      }
      return label;
    },
    showResult: function(hit) {
      var label = Ortho44._getLabel(hit, "POPUP");
      var feature = {"type": "Feature",
        "properties": {
            "name": label
        },
        "geometry": hit.geometry
      };
      resultsLayer.clearLayers();
      L.geoJson(feature, {
        style: function (feature) {
          if(feature.geometry.type=='Polygon') return {fillColor: 'transparent'};
        },
        onEachFeature: function onEachFeature(feature, layer) {
            layer.bindPopup(feature.properties.name);
        }
      }).addTo(resultsLayer);
      var bounds = resultsLayer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds);
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
    },

    randomDisplay: function() {
      // random view if no hash
      var niceLocations = [
        ["Le Terril, Abbaretz", 18, 47.56142, -1.54120],
        ["La Bôle de Merquel, Mesquer", 16, 47.4179, -2.4539],
        ["La Brière, Saint-Joachim", 16, 47.3734, -2.2223],
        ["Marais de Lyarne, Les Moutiers-en-Retz", 17, 47.04490, -1.97523],
        ["Château de Clisson et Domaine de la Garenne Lemot, Clisson", 18, 47.08590, -1.27772],
        ["Estuaire de la Loire", 15, 47.2907, -1.9411],
        ["Château, Châteaubriant", 18, 47.71958, -1.37327],
        ["La Loire, Ancenis", 16, 47.3705, -1.0800],
        ["Le Pont de Saint-Nazaire", 14, 47.2789, -2.1653],
        ["Lac de Vioreau", 15, 47.5232, -1.4230],
      ];
      var random = niceLocations[Math.floor(Math.random()*niceLocations.length)];
      map.setView([random[2], random[3]], random[1]);
      if(!location.hash) {
        document.getElementById("search-input").value = random[0];
        Ortho44.setClass(document.getElementById('search-input'), "random-display");
      }
    }

  };

  // #############
  //  MAP INIT
  // #############

  var max_bounds_strict = new L.LatLngBounds(new L.LatLng(46.86008, -2.55754), new L.LatLng(47.83486, -0.92346));
  var max_bounds_buffer = new L.LatLngBounds(new L.LatLng(46.8, -3.0), new L.LatLng(47.87, -0.8));
  var map = L.map('map',
      {
        maxBounds: max_bounds_buffer,
        zoomControl:false
      }
    );

  map.attributionControl.setPrefix('');
  map.on('load', function() {
    var hash = new L.Hash(map);
  });
  Ortho44.randomDisplay();

  // LAYERS
  var streets_mapquest = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {
    opacity: 0.5,
    minZoom: 9,
    maxZoom: 12,
    attribution: "MapQuest / OpenStreetMap",
    subdomains: '1234'
  }).addTo(map);

  var matrixIds3857= new Array(22);
  for (var i= 0; i<22; i++) {
      matrixIds3857[i]= {
          identifier    : "" + i,
          topLeftCorner : new L.LatLng(20037508,-20037508)
      };
  }
  
  var ign_keys = {
    'localhost': 'ymg58ktvpimfa7zyxjxyr1a5',
    'makinacorpus.github.io' : '9z9o6i52lxwch6mxt9wmwro5',
    'vuduciel.loire-atlantique.fr' :'287bdvzzjnxqhh4s0mqfto41'
  };
  var ign_key = ign_keys[location.hostname];
  var ign = new L.TileLayer.WMTS("http://wxs.ign.fr/"+ign_key+"/geoportail/wmts",
    {
      layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
      style: 'normal',
      maxZoom: 19,
      minZoom: 13,
      tilematrixSet: "PM",
      matrixIds: matrixIds3857,
      format: 'image/jpeg',
      attribution: "&copy; <a href='http://www.ign.fr'>IGN</a>"
    }
  ).addTo(map);

  L.TileLayer.include({
    _tileOnError: function () {
      var layer = this._layer;

      layer.fire('tileerror', {
        tile: this,
        url: this.src
      });

      var newUrl;
      if(this.src.indexOf(".jpg")>0) {
        newUrl = this.src.replace("jpg", "png");
      } else {
        newUrl = layer.options.errorTileUrl;
      }
      if (newUrl) {
        this.src = newUrl;
      }

      layer._tileLoaded();
      
    }
  });

  var ortho2012 = L.tileLayer('http://{s}.tiles.cg44.makina-corpus.net/ortho-2012/{z}/{x}/{y}.jpg', {
    continuousWorld: true,  // very important
    tms: true,
    maxZoom: 19,
    subdomains: "abcdefgh",
    attribution: "Source: Département de Loire-Atlantique"
  }).addTo(map);

  ortho2012.on('load', function() {
    // wait for progressive jpeg to render
    window.setTimeout(function() {
      Ortho44.setClass(document.querySelector('body'), "map-initialized");
    }, 500);
  })

  var border = L.geoJson(loire_atlantique_json, {
    style: function (feature) {
        return {
          fillColor: "transparent",
          fillOpacity: 0,
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          };
    }
  }).addTo(map);
  map.on('zoomend', function(e) {
    if (map.getZoom() > 14) {
      border.setStyle({color: 'transparent'});
    } else {
      border.setStyle({color: 'white'});
    }
  });

  // CONTROLS
  var osm = new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 11, attribution: "Map data &copy; OpenStreetMap contributors"});
  var miniMap = new L.Control.MiniMap(osm, {
    zoomLevelFixed: 7,
    fixedPosition: true,
    center: [-1.8237, 47.35],
    width: 160
  }).addTo(map);

  map.on('locationerror', function() {
    console.log("Too far away, keep default location");
  });
  var streets_custom_osm = L.tileLayer('http://{s}.tiles.cg44.makina-corpus.net/osm/{z}/{x}/{y}.png', {
    opacity: 0.8,
    maxZoom: 15,
    attribution: "Makina Corpus / OpenStreetMap",
    subdomains: 'abcdefgh'
  });

  var overlayMaps = {
    "Afficher les rues": streets_custom_osm,
    "Frontières du Département": border
  };
  L.control.layers(null, overlayMaps).addTo(map);

  L.control.locator().addTo(map);
  (new L.Control.ZoomFS()).addTo(map); 
  L.control.screenshot().addTo(map);
  L.control.imageDownload().addTo(map);
  L.control.wmsLink().addTo(map);
  L.control.snippet().addTo(map);
  L.control.social().addTo(map);
  L.control.scale({'imperial': false}).addTo(map);
  
  var resultsLayer = L.featureGroup().addTo(map);

  L.DomEvent.addListener(document.getElementById("search-input"), 'keyup', function(e) {
    if(e.keyCode != 13) {
      Ortho44.removeClass(document.getElementById('search-address'), "search-no-result");
      Ortho44.removeClass(document.getElementById('search-address'), "search-success");
    }
  }, this);

  Ortho44.bindGeocode(
    document.getElementById('search-address'),
    document.getElementById("search-input"),
    map,
    function (results) {
      var choices_box = document.getElementById('choice-list');
      Ortho44.removeClass(choices_box, "show-choices");
      if(results.hits.total > 0) {
        var best = results.hits.hits[0]._source;
        if(results.hits.total==1) {
          Ortho44.showResult(best);
        } else {
          var choices = {};
          for(var i=0;i<results.hits.hits.length;i++) {
            var hit = results.hits.hits[i]._source;
            var choice_label = Ortho44._getLabel(hit, "LISTING");
            //hit.nom ? hit.nom : (hit.nom_voie ? hit.nom_voie + ', ':'') + (hit.nom_ld ? hit.nom_ld + ', ':'') + '<strong>' + hit.commune + "</strong>";
            choices[choice_label] = hit;
          }

          choices_box.innerHTML = "";
          distinct = [];
          for(var choice in choices) {
            distinct.push(choice);
            var li = document.createElement("li");
            li.innerHTML = choice;
            L.DomEvent.addListener(li, 'click', (function(label, hit) {
              return function(){
                document.getElementById("search-input").value = label;
                Ortho44.removeClass(choices_box, "show-choices");
                Ortho44.showResult(hit);
              }
            }(li.textContent, choices[choice])));
            choices_box.appendChild(li);
          }
          if(distinct.length == 1) {
            Ortho44.showResult(best);
          } else {
            Ortho44.setClass(choices_box, "show-choices");
          }
        }
        Ortho44.setClass(document.getElementById('search-address'), "search-success");
        Ortho44.removeClass(document.getElementById('search-address'), "search-no-result");
      } else {
        resultsLayer.clearLayers();
        Ortho44.setClass(document.getElementById('search-address'), "search-no-result");
        Ortho44.removeClass(document.getElementById('search-address'), "search-success");
        choices_box.innerHTML = "";
        var p = document.createElement("p");
        p.textContent = "Aucun résultat trouvé.";
        choices_box.appendChild(p);
        Ortho44.setClass(choices_box, "show-choices");
      }
    });

  $(document).foundation(null, null, null, null, true);
  $(document).foundation('dropdown', 'off');

}
