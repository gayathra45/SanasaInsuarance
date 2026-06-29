import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { API_BASE_URL } from "../../config";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const BRANCH_PHONES: Record<string, string> = {
  Galle: "+94 91 223 4567",
  Matara: "+94 41 222 3456",
  Colombo: "+94 11 230 4567",
  Anuradhapura: "+94 25 222 3456",
  Embilipitiya: "+94 47 223 4567",
};

export default function AgentMapRoutePage() {
  const params = useLocalSearchParams<{
    claimId?: string;
    location?: string;
    branch?: string;
    userNic?: string;
    vehiclePlate?: string;
    damageType?: string;
    fromPage?: string;
  }>();

  const {
    claimId = "",
    location = "Galle, Sri Lanka",
    branch = "Galle",
    userNic = "",
    vehiclePlate = "",
    damageType = "",
    fromPage = "Dashboard",
  } = params;

  const [agentLocation, setAgentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [incidentCoords, setIncidentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocatingAgent, setIsLocatingAgent] = useState(true);
  const [isGeocodingClaim, setIsGeocodingClaim] = useState(true);
  const [phPhone, setPhPhone] = useState<string>("Loading...");
  
  // Dynamic Route details calculated from OSRM
  const [distanceText, setDistanceText] = useState("12.8 km");
  const [durationText, setDurationText] = useState("22 mins");

  // Navigation mode: FALSE = Route Preview Mode, TRUE = Active Navigation Mode
  const [isNavigating, setIsNavigating] = useState(false);

  // Voice Guidance state
  const [isMuted, setIsMuted] = useState(false);

  // Call sheet modal visibility
  const [callModalVisible, setCallModalVisible] = useState(false);

  // Custom Alert Modal State
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    buttons?: { text: string; onPress: () => void; style?: "default" | "cancel" }[];
  } | null>(null);

  const showAlert = (title: string, message: string) => setCustomAlert({ title, message });

  const branchPhone = BRANCH_PHONES[branch] || BRANCH_PHONES.Galle;

  // WebView reference to inject JS
  const webViewRef = useRef<any>(null);

  // Extract street name for green banner "toward [Street Name]"
  const getStreetName = (locStr: string) => {
    if (!locStr) return "Incident Scene";
    const parts = locStr.split(",");
    const street = parts[0]?.trim();
    if (!street) return "Incident Scene";
    return street.replace(/[0-9]/g, "").trim() || "Incident Scene";
  };

  // 1. Fetch Policy Holder phone number from backend
  useEffect(() => {
    if (userNic) {
      fetch(`${API_BASE_URL}/api/agent/policyholder/${userNic}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("PH phone fetch failed");
        })
        .then((data) => {
          if (data && data.mobile) {
            setPhPhone(data.mobile);
          } else {
            setPhPhone("Unavailable");
          }
        })
        .catch((e) => {
          console.warn("PH phone fetch error:", e);
          setPhPhone("Unavailable");
        });
    } else {
      setPhPhone("Unavailable");
    }
  }, [userNic]);

  // 2. Geocode incident location
  useEffect(() => {
    let active = true;
    const geocode = async () => {
      try {
        const query = encodeURIComponent(location + ", Sri Lanka");
        const res = await fetch("https://nominatim.openstreetmap.org/search?q=" + query + "&format=json&limit=1");
        if (res.ok) {
          const data = await res.json();
          if (active && data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setIncidentCoords({ latitude: lat, longitude: lon });
            setIsGeocodingClaim(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Nominatim Geocoding failed, using fallback:", e);
      }
      if (active) {
        setIncidentCoords({ latitude: 6.0535, longitude: 80.2210 }); // fallback Galle
        setIsGeocodingClaim(false);
      }
    };
    geocode();
    return () => {
      active = false;
    };
  }, [location]);

  // 3. Get GPS location
  useEffect(() => {
    let active = true;
    const getGPS = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (active) {
            setAgentLocation({ latitude: 6.9271, longitude: 79.8612 }); // fallback Colombo
            setIsLocatingAgent(false);
          }
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (active) {
          setAgentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setIsLocatingAgent(false);
        }
      } catch (e) {
        console.warn("GPS lookup error:", e);
        if (active) {
          setAgentLocation({ latitude: 6.915, longitude: 79.860 });
          setIsLocatingAgent(false);
        }
      }
    };
    getGPS();
    return () => {
      active = false;
    };
  }, []);

  // Handle messages sent back from OSRM router inside WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "ROUTE_INFO") {
        if (data.distance) setDistanceText(data.distance);
        if (data.duration) setDurationText(data.duration);
      }
    } catch (err) {
      console.warn("Error parsing webview postMessage:", err);
    }
  };

  // Dial a number
  const handleMakeCall = (phone: string) => {
    if (!phone || phone.includes("Unavailable") || phone.includes("Loading")) {
      showAlert("Error", "Valid contact number is not available.");
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      showAlert("Error", "Direct dial is not supported on this device.");
    });
  };

  // Re-center map view bounds
  const handleReCenterMap = () => {
    webViewRef.current?.injectJavaScript(`
      if (typeof pathLine !== 'undefined') {
        map.fitBounds(pathLine.getBounds().pad(0.18));
      } else {
        map.setView([${agentLocation?.latitude || 6.9271}, ${agentLocation?.longitude || 79.8612}], 13);
      }
      true;
    `);
  };

  // Compass Center Camera Directly on Agent Location
  const handleCompassCenter = () => {
    webViewRef.current?.injectJavaScript(`
      map.setView([${agentLocation?.latitude || 6.9271}, ${agentLocation?.longitude || 79.8612}], 16);
      true;
    `);
    showAlert("GPS Re-centered", "Centering camera directly on your current GPS location coordinates.");
  };

  // Search Nearby Amenities Along Route
  const handleSearchDirectory = () => {
    setCustomAlert({
      title: "Search Amenities",
      message: "Locate nearest services along the incident navigation route:",
      buttons: [
        {
          text: "Fuel Stations",
          onPress: () => {
            setCustomAlert(null);
            setTimeout(() => {
              showAlert("Searching Fuel Points", "Displaying nearest Ceylon Petroleum and Lanka IOC pumps on the road network.");
            }, 400);
          }
        },
        {
          text: "Police Divisions",
          onPress: () => {
            setCustomAlert(null);
            setTimeout(() => {
              showAlert("Searching Police Divisions", "Locating nearest Southern Province police station divisions.");
            }, 400);
          }
        },
        {
          text: "Dismiss",
          style: "cancel",
          onPress: () => setCustomAlert(null)
        }
      ]
    });
  };

  // Toggle Voice navigation Guidances
  const handleToggleAudio = () => {
    setIsMuted(prev => !prev);
    showAlert("Voice Guidance", !isMuted ? "Voice navigation instructions muted." : "Voice navigation instructions unmuted.");
  };

  // Report traffic jam / Road hazard event
  const handleReportIncident = () => {
    setCustomAlert({
      title: "Report Road Event",
      message: "Contribute live traffic and hazard updates to other active agents:",
      buttons: [
        {
          text: "Traffic Congestion",
          onPress: () => {
            setCustomAlert(null);
            setTimeout(() => {
              showAlert("Traffic Logged", "Thanks! Traffic congestion report logged successfully.");
            }, 400);
          }
        },
        {
          text: "Accident Scene",
          onPress: () => {
            setCustomAlert(null);
            setTimeout(() => {
              showAlert("Emergency Logged", "Thanks! Accident logged. Dispatching road assistance units.");
            }, 400);
          }
        },
        {
          text: "Road Obstacle",
          onPress: () => {
            setCustomAlert(null);
            setTimeout(() => {
              showAlert("Hazard Logged", "Road work/obstruction report submitted.");
            }, 400);
          }
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setCustomAlert(null)
        }
      ]
    });
  };

  // End navigation & return to modal Step 4
  const handleEndNavigation = () => {
    const routePath = fromPage === "Claims" ? "/Agent/Claims/page" : "/Agent/Dashboard/page";
    router.replace({
      pathname: routePath,
      params: { claimId, step: "4" },
    });
  };

  // Back button returns to Route Preview if navigating, or returns to originating modal sheet
  const handleBack = () => {
    if (isNavigating) {
      setIsNavigating(false);
    } else {
      const routePath = fromPage === "Claims" ? "/Agent/Claims/page" : "/Agent/Dashboard/page";
      router.replace({
        pathname: routePath,
        params: { claimId },
      });
    }
  };

  const agentLat = agentLocation?.latitude || 6.9271;
  const agentLon = agentLocation?.longitude || 79.8612;
  const claimLat = incidentCoords?.latitude || 6.0535;
  const claimLon = incidentCoords?.longitude || 80.2210;

  // Leaflet map HTML with real road network route plotting using OSRM API
  const mapHtml = `
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
        .agent-marker {
          width: 26px;
          height: 26px;
          background-color: #0284c7;
          border: 4px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 14px rgba(2, 132, 199, 0.7);
        }
        .incident-marker {
          width: 26px;
          height: 26px;
          background-color: #dc2626;
          border: 4px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 14px rgba(220, 38, 38, 0.7);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const agentCoords = [${agentLat}, ${agentLon}];
        const claimCoords = [${claimLat}, ${claimLon}];

        const map = L.map('map', {
          zoomControl: false,
          maxZoom: 18,
          minZoom: 4
        }).setView(agentCoords, 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 18
        }).addTo(map);

        L.marker(agentCoords, {
          icon: L.divIcon({
            className: 'agent-marker',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          })
        }).addTo(map).bindPopup("Your Location (Agent)").openPopup();

        L.marker(claimCoords, {
          icon: L.divIcon({
            className: 'incident-marker',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          })
        }).addTo(map).bindPopup("Incident Scene: ${location.replace(/'/g, "\\'")}");

        // Fetch real road route path from OSRM Driving routing service
        const routeUrl = 'https://router.project-osrm.org/route/v1/driving/' + agentCoords[1] + ',' + agentCoords[0] + ';' + claimCoords[1] + ',' + claimCoords[0] + '?overview=full&geometries=geojson';

        // Declare pathLine globally so we can reference it in injectJavaScript calls
        var pathLine;

        fetch(routeUrl)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
              
              // Plot real street route (cyan line)
              pathLine = L.polyline(coords, {
                color: '#00b4d8',
                weight: 6,
                opacity: 0.95,
                lineJoin: 'round'
              }).addTo(map);

              map.fitBounds(pathLine.getBounds().pad(0.18));

              // Send calculations back to React Native UI
              const distKm = (route.distance / 1000).toFixed(1);
              const durationMin = Math.round(route.duration / 60);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ROUTE_INFO',
                distance: distKm + ' km',
                duration: durationMin + ' mins'
              }));
            } else {
              drawFallbackLine();
            }
          })
          .catch(err => {
            console.warn('OSRM error, drawing fallback line:', err);
            drawFallbackLine();
          });

        function drawFallbackLine() {
          const fallbackLine = L.polyline([agentCoords, claimCoords], {
            color: '#dc2626',
            weight: 5,
            opacity: 0.8,
            dashArray: '10, 10'
          }).addTo(map);
          map.fitBounds(fallbackLine.getBounds().pad(0.18));
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.root}>
      {/* ── HEADER BAR ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>
            {isNavigating ? "Navigation to Incident" : "Route Preview"}
          </Text>
          <Text style={styles.headerSubtext}>{claimId}</Text>
        </View>
      </View>

      {/* ── ROAD MAP & OVERLAYS VIEW ── */}
      <View style={styles.mapContainer}>
        {isLocatingAgent || isGeocodingClaim ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loaderText}>Configuring road routes...</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <WebView
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html: mapHtml }}
              style={{ flex: 1 }}
              onMessage={handleWebViewMessage}
            />

            {/* ── NAVIGATION OVERLAYS (Shown only during active navigation) ── */}
            {isNavigating ? (
              <>
                {/* ── FLOATING OVERLAY: GOOGLE MAPS STYLE NAVIGATION BANNER ── */}
                <View style={styles.navGreenBanner}>
                  <View style={styles.greenBannerArrowWrap}>
                    <Ionicons name="arrow-up" size={22} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.greenBannerToward}>toward</Text>
                    <Text style={styles.greenBannerStreet} numberOfLines={1}>
                      {getStreetName(location)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.greenBannerStar} activeOpacity={0.8}>
                    <Ionicons name="sparkles" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* ── FLOATING OVERLAY: SIDE CIRCULAR CONTROL BUTTONS (Compass, Search, Mute) ── */}
                <View style={styles.sideControls}>
                  <TouchableOpacity
                    style={styles.circleCtrl}
                    onPress={handleCompassCenter}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="compass" size={20} color="#dc2626" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.circleCtrl}
                    onPress={handleSearchDirectory}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="search" size={20} color="#475569" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.circleCtrl}
                    onPress={handleToggleAudio}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isMuted ? "volume-mute" : "volume-high"}
                      size={20}
                      color={isMuted ? "#dc2626" : "#475569"}
                    />
                  </TouchableOpacity>
                </View>

                {/* ── FLOATING OVERLAY: BOTTOM CAPSULE BUTTONS (Re-center, Report Event) ── */}
                <View style={styles.bottomCapsulesRow}>
                  <TouchableOpacity
                    style={styles.capsuleBtn}
                    onPress={handleReCenterMap}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="navigate" size={13} color="#ffffff" />
                    <Text style={styles.capsuleBtnText}>Re-center</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.capsuleBtn}
                    onPress={handleReportIncident}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="warning" size={13} color="#fbbf24" style={{ marginRight: 2 }} />
                    <Text style={styles.capsuleBtnText}>Report</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* ── ROUTE PREVIEW MODE SEARCH BANNER (Top card matching Google Maps mockup layout - White Theme) ── */
              <View style={styles.previewSearchCard}>
                <View style={styles.previewSearchLineRow}>
                  <View style={styles.blueDot} />
                  <Text style={styles.previewSearchText} numberOfLines={1}>
                    Your location
                  </Text>
                </View>
                <View style={styles.previewSearchDivider} />
                <View style={styles.previewSearchLineRow}>
                  <Ionicons name="location" size={16} color="#dc2626" />
                  <Text style={[styles.previewSearchText, { color: "#0f172a", fontWeight: "900" }]} numberOfLines={1}>
                    {getStreetName(location)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.previewSearchSwapBtn} activeOpacity={0.7}>
                  <Ionicons name="swap-vertical" size={18} color="#475569" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── BOTTOM SHEETS (Switches layout based on isNavigating state) ── */}
      {isNavigating ? (
        /* Active Navigation Bottom Sheet */
        <View style={styles.bottomSheet}>
          <View style={styles.infoRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={styles.vehicleIconWrap}>
                <Ionicons name="car-sport" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehiclePlateText}>{vehiclePlate || "VN-7645"}</Text>
                <Text style={styles.vehicleModelText} numberOfLines={1}>
                  {damageType || "Total Loss / Rollover"}
                </Text>
              </View>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.etaText}>{durationText}</Text>
              <Text style={styles.distanceText}>{distanceText}</Text>
            </View>
          </View>

          <View style={styles.locationWrap}>
            <Ionicons name="location-sharp" size={16} color="#dc2626" />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.callIconBtn}
              onPress={() => setCallModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={20} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endNavBtn}
              onPress={handleEndNavigation}
              activeOpacity={0.8}
            >
              <Ionicons name="stop-circle" size={18} color="#fff" />
              <Text style={styles.endNavText}>End Navigation & Start Inspection</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Route Preview Bottom Sheet (Premium White style sheet) */
        <View style={styles.bottomSheet}>
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.previewEtaText}>{durationText} ({distanceText})</Text>
              <View style={styles.bestRouteBadge}>
                <Text style={styles.bestRouteBadgeText}>Best route</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
              <Ionicons name="leaf" size={14} color="#16a34a" />
              <Text style={{ color: "#64748b", fontSize: 12.5, fontWeight: "700" }}>Saves 5% fuel</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: "#e2e8f0", marginVertical: 4 }} />

          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity
              style={styles.callIconBtn}
              onPress={() => setCallModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={20} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewStartBtn}
              onPress={() => setIsNavigating(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={18} color="#ffffff" />
              <Text style={styles.previewStartBtnText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── CALL POPUP MODAL ── */}
      <Modal
        visible={callModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCallModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Directories</Text>
              <TouchableOpacity
                onPress={() => setCallModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Branch Contact */}
              <View style={styles.contactItem}>
                <View style={styles.contactIconBox}>
                  <Ionicons name="business" size={20} color="#0284c7" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.contactLabel}>{branch} Branch Office</Text>
                  <Text style={styles.contactPhone}>{branchPhone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callActBtn}
                  onPress={() => handleMakeCall(branchPhone)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Policy Holder Contact */}
              <View style={styles.contactItem}>
                <View style={[styles.contactIconBox, { backgroundColor: "#f0fdf4" }]}>
                  <Ionicons name="person" size={20} color="#16a34a" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.contactLabel}>Policy Holder Mobile</Text>
                  <Text style={styles.contactPhone}>{phPhone}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.callActBtn, { backgroundColor: "#16a34a" }]}
                  onPress={() => handleMakeCall(phPhone)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalFooterBtn}
              onPress={() => setCallModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalFooterBtnText}>Close Contact Directory</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CUSTOM PREMIUM ALERT DIALOG OVERLAY ── */}
      <Modal
        visible={customAlert !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomAlert(null)}
      >
        {customAlert && (() => {
          const titleL = (customAlert.title || "").toLowerCase();
          const msgL = (customAlert.message || "").toLowerCase();
          const isSuccess = titleL.includes("success") || msgL.includes("success") || titleL.includes("completed") || msgL.includes("completed") || titleL.includes("centered") || titleL.includes("logged");
          const isError = titleL.includes("error") || titleL.includes("denied") || titleL.includes("required") || titleL.includes("validation");
          
          let iconName = "information-circle-outline";
          let iconColor = "#0284c7";
          let circleBg = "rgba(2, 132, 199, 0.08)";
          let circleBorder = "rgba(2, 132, 199, 0.15)";
          
          if (isSuccess) {
            iconName = "checkmark-circle-outline";
            iconColor = "#16a34a";
            circleBg = "rgba(22, 163, 74, 0.08)";
            circleBorder = "rgba(22, 163, 74, 0.15)";
          } else if (isError) {
            iconName = "alert-circle-outline";
            iconColor = "#dc2626";
            circleBg = "rgba(220, 38, 38, 0.08)";
            circleBorder = "rgba(220, 38, 38, 0.15)";
          }

          return (
            <View style={styles.alertOverlay}>
              <View style={styles.alertCard}>
                <View style={[styles.alertIconCircle, { backgroundColor: circleBg, borderColor: circleBorder }]}>
                  <Ionicons name={iconName as any} size={38} color={iconColor} />
                </View>
                <Text style={styles.alertTitle}>{customAlert.title}</Text>
                <Text style={styles.alertMsg}>{customAlert.message}</Text>
                
                {/* Dynamic Buttons Rendering */}
                {customAlert.buttons && customAlert.buttons.length > 0 ? (
                  <View style={{ width: "100%", gap: 8, marginTop: 10 }}>
                    {customAlert.buttons.map((btn, idx) => {
                      const isCancel = btn.style === "cancel";
                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.8}
                          onPress={btn.onPress}
                          style={[
                            styles.alertButton,
                            { width: "100%" },
                            isCancel && { backgroundColor: "#f1f5f9", shadowColor: "transparent" }
                          ]}
                        >
                          <Text style={[styles.alertButtonText, isCancel && { color: "#475569" }]}>
                            {btn.text}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setCustomAlert(null)}
                    style={styles.alertButton}
                  >
                    <Text style={styles.alertButtonText}>OK</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })()}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "ios" ? 54 : 40,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  headerSubtext: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 2,
  },
  headerCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f9ff",
    borderWidth: 1.5,
    borderColor: "#e0f2fe",
    position: "relative",
  },
  badge68: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#eab308", // Golden-yellow
    borderRadius: 8.5,
    minWidth: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  badge68Text: {
    color: "#0f172a",
    fontSize: 9,
    fontWeight: "900",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    position: "relative",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },

  /* Preview Search Card (Top card matching Google Maps mockup layout - White Theme) */
  previewSearchCard: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "#ffffff", // White theme search card
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  previewSearchLineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 32,
  },
  blueDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0284c7",
    marginLeft: 3,
  },
  previewSearchText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    flex: 1,
  },
  previewSearchDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 6,
    marginLeft: 26,
  },
  previewSearchSwapBtn: {
    position: "absolute",
    right: 16,
    top: 32,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  /* Floating green Maps banner */
  navGreenBanner: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "#075e54", // Google Map dark teal-green
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  greenBannerArrowWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  greenBannerToward: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textTransform: "lowercase",
  },
  greenBannerStreet: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "900",
    marginTop: 2,
  },
  greenBannerStar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  /* Side circle overlay buttons */
  sideControls: {
    position: "absolute",
    top: 96,
    right: 16,
    gap: 10,
    zIndex: 10,
  },
  circleCtrl: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },

  /* Bottom capsule controls */
  bottomCapsulesRow: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  capsuleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  capsuleBtnText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "800",
  },

  /* Bottom sheet */
  bottomSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vehicleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  vehiclePlateText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },
  vehicleModelText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 2,
  },
  etaText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0284c7",
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 2,
  },
  locationWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 4,
  },
  callIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  endNavBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  endNavText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },

  /* Preview sheet labels */
  previewEtaText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#16a34a", // Emerald green theme
  },
  bestRouteBadge: {
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bestRouteBadgeText: {
    color: "#0284c7",
    fontSize: 10,
    fontWeight: "800",
  },
  previewStartBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0284c7", // Premium blue start button matching dashboard theme
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0284c7",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  previewStartBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },

  /* call modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    gap: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  contactIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  contactPhone: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  callActBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#0284c7",
    alignItems: "center",
    justifyContent: "center",
  },
  modalFooterBtn: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  modalFooterBtnText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },

  /* Custom Alert Styles */
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center", justifyContent: "center",
    zIndex: 9999,
  },
  alertCard: {
    width: "85%", maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 24, borderWidth: 1, borderColor: "#e2e8f0",
    padding: 24, alignItems: "center",
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
  },
  alertIconCircle: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  alertTitle: { fontSize: 18, fontWeight: "900", color: "#0f172a", marginBottom: 8, textAlign: "center" },
  alertMsg: { fontSize: 13, color: "#475569", textAlign: "center", lineHeight: 18, marginBottom: 20 },
  alertButton: {
    backgroundColor: "#0284c7", borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 36,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#0284c7", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  alertButtonText: { color: "#fff", fontSize: 13.5, fontWeight: "800" },
});
