import React, { useState } from "react";
import { StyleSheet, View, Text, Modal, TouchableOpacity, Platform, ActivityIndicator, Alert, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

interface MapSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

const getHtmlContent = (lat: number, lon: number) => `
<!DOCTYPE html>
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
    var startLat = ${lat};
    var startLon = ${lon};

    var map = L.map('map', {
      zoomControl: false,
      maxZoom: 21,
      minZoom: 7,
      maxBounds: [[5.5, 78.5], [10.5, 82.5]],
      maxBoundsViscosity: 1.0
    }).setView([startLat, startLon], 15);

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

    var marker = L.marker([startLat, startLon], {
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

    function handleMessage(e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.latitude && data.longitude) {
          var newLatLng = new L.LatLng(data.latitude, data.longitude);
          marker.setLatLng(newLatLng);
          map.panTo(newLatLng);
        }
      } catch (err) {}
    }
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);
  </script>
</body>
</html>
`;

const WebViewComponent = WebView as any;

export default function MapSelectorModal({ visible, onClose, latitude, longitude, onLocationSelect }: MapSelectorModalProps) {
  const [tempCoords, setTempCoords] = useState({ latitude, longitude });
  const [modalAddress, setModalAddress] = useState("Loading address...");
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const webViewRef = React.useRef<any>(null);
  const htmlContent = getHtmlContent(latitude, longitude);

  // Autocomplete suggestions debouncer
  React.useEffect(() => {
    if (!isUserTyping || !modalAddress || modalAddress.trim() === "" || modalAddress === "Loading address..." || modalAddress.startsWith("Loading")) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const biasLat = tempCoords.latitude;
        const biasLon = tempCoords.longitude;
        const left = biasLon - 0.5;
        const right = biasLon + 0.5;
        const top = biasLat + 0.5;
        const bottom = biasLat - 0.5;
        const viewboxParam = `&viewbox=${left},${top},${right},${bottom}`;

        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(modalAddress)}&limit=5&countrycodes=lk&accept-language=en${viewboxParam}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setSearchResults(data);
          setShowResultsDropdown(true);
        } else {
          setSearchResults([]);
          setShowResultsDropdown(false);
        }
      } catch (err) {
        console.warn("Autocomplete error:", err);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [modalAddress, isUserTyping]);

  // Sync state with props when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setTempCoords({ latitude, longitude });
    }
  }, [visible, latitude, longitude]);

  // Sync temp coordinates from iframe when running on web
  React.useEffect(() => {
    if (Platform.OS !== "web" || !visible) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.latitude && data.longitude) {
          setTempCoords({ latitude: data.latitude, longitude: data.longitude });
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [visible]);

  // Fetch address based on selection
  const fetchAddress = async (lat: number, lon: number) => {
    setIsUserTyping(false);
    setShowResultsDropdown(false);
    try {
      if (Platform.OS === "web") {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`);
        const data = await res.json();
        if (data && data.display_name) {
          setModalAddress(data.display_name);
          return;
        }
      } else {
        const addressArray = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (addressArray && addressArray.length > 0) {
          const item = addressArray[0];
          const street = item.street || "";
          const city = item.city || item.subregion || "";
          const district = item.district || "";
          const country = item.country || "";
          
          let fullAddress = "";
          if (street) fullAddress += `${street}, `;
          if (district) fullAddress += `${district}, `;
          if (city) fullAddress += `${city}, `;
          if (country) fullAddress += country;
          fullAddress = fullAddress.trim().replace(/,\s*$/, "");
          setModalAddress(fullAddress || `${lat.toFixed(6)}, ${lon.toFixed(6)}`);
          return;
        }
      }
      setModalAddress(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    } catch {
      setModalAddress(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    }
  };

  React.useEffect(() => {
    fetchAddress(tempCoords.latitude, tempCoords.longitude);
  }, [tempCoords]);

  // Handle GPS location inside modal
  const handleModalGPSLocation = async () => {
    setIsLocating(true);
    try {
      if (Platform.OS === "web") {
        if (!navigator.geolocation) {
          alert("Geolocation is not supported by your browser.");
          setIsLocating(false);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: lat, longitude: lon } = position.coords;
            setTempCoords({ latitude: lat, longitude: lon });
            
            // Post message to iframe
            const iframe = document.querySelector("iframe") as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage(JSON.stringify({ latitude: lat, longitude: lon }), "*");
            }
            setIsLocating(false);
          },
          (err) => {
            alert("Could not retrieve GPS location.");
            setIsLocating(false);
          }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Please enable location permissions to retrieve your GPS location.");
          setIsLocating(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude: lat, longitude: lon } = location.coords;
        setTempCoords({ latitude: lat, longitude: lon });
        
        // Post message to WebView
        const data = JSON.stringify({ latitude: lat, longitude: lon });
        if (webViewRef.current) {
          webViewRef.current.postMessage(data);
        }
        setIsLocating(false);
      }
    } catch (e) {
      console.warn("Modal GPS error:", e);
      setIsLocating(false);
    }
  };

  const handleConfirm = () => {
    onLocationSelect(tempCoords.latitude, tempCoords.longitude);
    onClose();
  };

  const handleSearch = async () => {
    if (!modalAddress || modalAddress.trim() === "") return;
    setIsUserTyping(false);
    setShowResultsDropdown(false);
    setIsSearching(true);
    try {
      const biasLat = tempCoords.latitude;
      const biasLon = tempCoords.longitude;
      const left = biasLon - 1.0;
      const right = biasLon + 1.0;
      const top = biasLat + 1.0;
      const bottom = biasLat - 1.0;
      const viewboxParam = `&viewbox=${left},${top},${right},${bottom}`;

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(modalAddress)}&limit=5&countrycodes=lk&accept-language=en${viewboxParam}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setSearchResults(data);
        setShowResultsDropdown(true);
        
        // Auto-select the first result
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setTempCoords({ latitude: lat, longitude: lon });
        
        // Post message to map
        const msgData = JSON.stringify({ latitude: lat, longitude: lon });
        if (Platform.OS === "web") {
          const iframe = document.querySelector("iframe") as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(msgData, "*");
          }
        } else {
          if (webViewRef.current) {
            webViewRef.current.postMessage(msgData);
          }
        }
      } else {
        setSearchResults([]);
        setShowResultsDropdown(false);
        if (Platform.OS === "web") {
          alert("Location Not Found. Could not find coordinates for this address.");
        } else {
          Alert.alert("Location Not Found", "Could not find coordinates for this address.");
        }
      }
    } catch (e) {
      console.warn("Geocoding error:", e);
      if (Platform.OS === "web") {
        alert("Search Error. An error occurred while searching for the location.");
      } else {
        Alert.alert("Search Error", "An error occurred while searching for the location.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.popupContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#0d2a3a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Location</Text>
            <View style={{ width: 40 }} />
          </View>

        {/* Map Area */}
        <View style={styles.mapContainer}>
          {/* Floating Search Bar */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={modalAddress}
                onChangeText={(text) => {
                  setModalAddress(text);
                  setIsUserTyping(true);
                  if (!text) {
                    setSearchResults([]);
                    setShowResultsDropdown(false);
                  }
                }}
                onSubmitEditing={handleSearch}
                placeholder="Search address or landmark..."
                placeholderTextColor="#94a3b8"
                returnKeyType="search"
              />
              {modalAddress ? (
                <TouchableOpacity onPress={() => {
                  setModalAddress("");
                  setSearchResults([]);
                  setShowResultsDropdown(false);
                  setIsUserTyping(false);
                }} style={styles.clearSearchBtn}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="search" size={18} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Suggestions Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {searchResults.map((result, idx) => {
                const parts = result.display_name.split(",");
                const mainTitle = parts[0]?.trim() || "";
                const subTitle = parts.slice(1).join(",").trim() || "";
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionItem}
                    onPress={() => {
                      const lat = parseFloat(result.lat);
                      const lon = parseFloat(result.lon);
                      setIsUserTyping(false);
                      setTempCoords({ latitude: lat, longitude: lon });
                      setModalAddress(result.display_name);
                      setShowResultsDropdown(false);
                      
                      // Post message to map
                      const msgData = JSON.stringify({ latitude: lat, longitude: lon });
                      if (Platform.OS === "web") {
                        const iframe = document.querySelector("iframe") as HTMLIFrameElement;
                        if (iframe && iframe.contentWindow) {
                          iframe.contentWindow.postMessage(msgData, "*");
                        }
                      } else {
                        if (webViewRef.current) {
                          webViewRef.current.postMessage(msgData);
                        }
                      }
                    }}
                  >
                    <View style={styles.suggestionIconWrapper}>
                      <Ionicons name="location" size={16} color="#64748b" />
                    </View>
                    <View style={{ flex: 1, flexDirection: "column" }}>
                      <Text numberOfLines={1} style={styles.suggestionTitle}>
                        {mainTitle}
                      </Text>
                      {subTitle ? (
                        <Text numberOfLines={1} style={styles.suggestionSubtitle}>
                          {subTitle}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {Platform.OS === "web" ? (
            <iframe
              srcDoc={htmlContent}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              title="Select Location Map"
            />
          ) : (
            <WebViewComponent
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html: htmlContent }}
              onMessage={(event: any) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.latitude && data.longitude) {
                    setTempCoords({ latitude: data.latitude, longitude: data.longitude });
                  }
                } catch {}
              }}
              style={styles.map}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          )}

          {/* Floating GPS Button */}
          <TouchableOpacity
            style={styles.floatingGpsBtn}
            onPress={handleModalGPSLocation}
            disabled={isLocating}
            activeOpacity={0.7}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#0d2a3a" />
            ) : (
              <Ionicons name="locate" size={24} color="#0d2a3a" />
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.coordText}>
            Coordinates: {tempCoords.latitude.toFixed(6)}, {tempCoords.longitude.toFixed(6)}
          </Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  popupContainer: {
    height: "90%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0d2a3a",
  },
  addressBar: {
    backgroundColor: "#f8fafc",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  addressText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "700",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    position: "relative",
  },
  map: {
    flex: 1,
  },
  floatingGpsBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  coordText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmBtn: {
    backgroundColor: "#0d2a3a",
    borderRadius: 99,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  searchBarContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 6,
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  searchBtn: {
    backgroundColor: "#0284c7",
    borderRadius: 20,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(2, 132, 199, 0.3)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  searchBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 72,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 20,
    padding: 6,
    zIndex: 11,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    maxHeight: 220,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
  },
  suggestionIconWrapper: {
    backgroundColor: "#f1f5f9",
    borderRadius: 99,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTitle: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "700",
  },
  suggestionSubtitle: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "400",
    marginTop: 2,
  },
});
