import { NextResponse } from "next/server";

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
    }
    #layer-control {
      position: absolute;
      bottom: 24px;
      left: 24px;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #layer-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0d2a3a;
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
    }
    #layer-btn:hover {
      background-color: #f8fafc;
      color: #0284c7;
      border-color: #0284c7;
    }
    #layer-menu {
      position: absolute;
      bottom: 48px;
      left: 0;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 100px;
      transform-origin: bottom left;
    }
    #layer-menu.hidden {
      display: none;
    }
    .layer-option {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
    }
    .layer-option:hover {
      background-color: #f1f5f9;
      color: #0d2a3a;
    }
    .layer-option.active {
      background-color: #f0f9ff;
      color: #0284c7;
    }
    
    /* Custom pulsing marker styles */
    .custom-div-icon {
      background: none;
      border: none;
    }
    .custom-pin-container {
      position: relative;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pulsing-ring {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 14px;
      height: 6px;
      background-color: rgba(220, 38, 38, 0.45);
      border-radius: 50%;
      animation: pin-pulse 1.6s infinite ease-out;
      pointer-events: none;
      z-index: -1;
    }
    @keyframes pin-pulse {
      0% {
        transform: translateX(-50%) scale(0.6);
        opacity: 0.9;
        box-shadow: 0 0 0 0px rgba(220, 38, 38, 0.7);
      }
      70% {
        transform: translateX(-50%) scale(2.2);
        opacity: 0;
        box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
      }
      100% {
        transform: translateX(-50%) scale(2.2);
        opacity: 0;
        box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
      }
    }
    .pin-svg {
      filter: drop-shadow(0 4px 6px rgba(15, 23, 42, 0.25));
      animation: pin-bounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes pin-bounce {
      0% {
        transform: translateY(-24px);
        opacity: 0;
      }
      70% {
        transform: translateY(2px);
      }
      100% {
        transform: translateY(0);
      }
    }
    
    /* Customize Leaflet Zoom Controls */
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.12), 0 2px 6px -1px rgba(15, 23, 42, 0.08) !important;
    }
    .leaflet-control-zoom-in, .leaflet-control-zoom-out {
      background-color: rgba(255, 255, 255, 0.95) !important;
      color: #0d2a3a !important;
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      width: 36px !important;
      height: 36px !important;
      line-height: 34px !important;
      font-size: 16px !important;
      font-weight: bold !important;
      transition: all 0.2s ease !important;
    }
    .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
      background-color: #ffffff !important;
      color: #0284c7 !important;
      border-color: #0284c7 !important;
    }
    .leaflet-control-zoom-in {
      border-top-left-radius: 10px !important;
      border-top-right-radius: 10px !important;
      border-bottom: none !important;
    }
    .leaflet-control-zoom-out {
      border-bottom-left-radius: 10px !important;
      border-bottom-right-radius: 10px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="layer-control">
    <button id="layer-btn" title="Change Map Style">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    </button>
    <div id="layer-menu" class="hidden">
      <div class="layer-option active" data-layer="voyager">Standard</div>
      <div class="layer-option" data-layer="satellite">Satellite</div>
      <div class="layer-option" data-layer="terrain">Terrain</div>
    </div>
  </div>
  <script>
    var lat = 6.9271;
    var lon = 79.8612;

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('lat') && urlParams.has('lon')) {
      lat = parseFloat(urlParams.get('lat'));
      lon = parseFloat(urlParams.get('lon'));
    }

    var map = L.map('map', {
      zoomControl: false,
      maxZoom: 21,
      minZoom: 7,
      maxBounds: [[5.5, 78.5], [10.5, 82.5]],
      maxBoundsViscosity: 1.0
    }).setView([lat, lon], 15);

    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    var layers = {
      voyager: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OSM © CARTO',
        maxNativeZoom: 18,
        maxZoom: 21
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxNativeZoom: 18,
        maxZoom: 21
      }),
      terrain: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxNativeZoom: 18,
        maxZoom: 21
      })
    };

    layers.voyager.addTo(map);
    var currentLayerName = 'voyager';

    // Layer selection listeners
    var layerBtn = document.getElementById('layer-btn');
    var layerMenu = document.getElementById('layer-menu');
    
    layerBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      layerMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', function() {
      layerMenu.classList.add('hidden');
    });

    layerMenu.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    var options = document.querySelectorAll('.layer-option');
    options.forEach(function(opt) {
      opt.addEventListener('click', function() {
        var layerName = opt.getAttribute('data-layer');
        if (layerName === currentLayerName) return;
        
        map.removeLayer(layers[currentLayerName]);
        layers[layerName].addTo(map);
        currentLayerName = layerName;
        
        options.forEach(function(o) { o.classList.remove('active'); });
        opt.classList.add('active');
        layerMenu.classList.add('hidden');
      });
    });

    var customIcon = L.divIcon({
      html: '<div class="custom-pin-container">' +
              '<div class="pulsing-ring"></div>' +
              '<svg class="pin-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626"/><circle cx="12" cy="9" r="3" fill="#ffffff"/></svg>' +
            '</div>',
      className: 'custom-div-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    var marker = L.marker([lat, lon], {
      draggable: true,
      icon: customIcon
    }).addTo(map);

    function sendLocation(newLat, newLon) {
      var data = JSON.stringify({ latitude: newLat, longitude: newLon });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(data);
      }
      window.parent.postMessage(data, '*');
    }

    map.on('click', function(e) {
      var newLat = e.latlng.lat;
      var newLon = e.latlng.lng;
      marker.setLatLng(e.latlng);
      map.panTo(e.latlng);
      sendLocation(newLat, newLon);
    });

    marker.on('dragend', function(e) {
      var position = marker.getLatLng();
      sendLocation(position.lat, position.lng);
    });

    window.addEventListener('message', function(e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.latitude && data.longitude) {
          var newLatLng = new L.LatLng(data.latitude, data.longitude);
          marker.setLatLng(newLatLng);
          map.panTo(newLatLng);
        }
      } catch (err) {}
    });
  </script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
