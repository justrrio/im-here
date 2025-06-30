import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

interface MemberLocation {
  userId: string;
  username: string;
  latitude: number;
  longitude: number;
  lastUpdated: any;
  isAdmin: boolean;
  estimatedTime?: string;
}

interface LiveTrackingMapProps {
  members: MemberLocation[];
  destination?: { lat: number; lng: number; address: string } | null;
  currentUserId: string;
  onMemberSelect?: (member: MemberLocation) => void;
}

export default function LiveTrackingMap({
  members,
  destination,
  currentUserId,
  onMemberSelect,
}: LiveTrackingMapProps) {
  const generateMapHTML = () => {
    // Calculate center point based on members and destination
    let centerLat = -6.2088; // Jakarta default
    let centerLng = 106.8456;

    if (members.length > 0) {
      const lats = members.map((m) => m.latitude).filter((lat) => lat !== 0);
      const lngs = members.map((m) => m.longitude).filter((lng) => lng !== 0);

      if (destination) {
        lats.push(destination.lat);
        lngs.push(destination.lng);
      }

      if (lats.length > 0) {
        centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      }
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        #map { width: 100%; height: 100vh; }
        .control-buttons {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .control-btn {
          width: 40px;
          height: 40px;
          background: white;
          border: none;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          cursor: pointer;
          font-size: 18px;
        }
        .control-btn:hover {
          background: #f0f0f0;
        }
        .member-popup {
          min-width: 200px;
          padding: 8px;
        }
        .member-name {
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 4px;
        }
        .member-status {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        .estimated-time {
          font-size: 14px;
          font-weight: 600;
          color: #ef4444;
          background: #fef2f2;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        .destination-popup {
          min-width: 180px;
          padding: 8px;
        }
        .destination-name {
          font-weight: bold;
          color: #ef4444;
          margin-bottom: 4px;
        }
        .destination-address {
          font-size: 12px;
          color: #666;
        }
      </style>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    </head>
    <body>
      <div class="control-buttons">
        <button class="control-btn" onclick="centerToCurrentUser()" title="My Location">📍</button>
        ${
          destination
            ? `<button class="control-btn" onclick="centerToDestination()" title="Destination">🎯</button>`
            : ""
        }
        <button class="control-btn" onclick="showAllLocations()" title="Show All">🗺️</button>
      </div>
      
      <div id="map"></div>
      
      <script>
        try {
          console.log('🗺️ Initializing Live Tracking Map...');
          
          // Initialize map
          const map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
          
          // Store all markers for controls
          let allMarkers = [];
          let memberMarkers = [];
          let destinationMarker = null;
          let currentUserMarker = null;
          let polylines = []; // Store routing polylines
          
          // Use CartoDB tiles (confirmed working)
          L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            attribution: '© CartoDB © OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
          // Add destination marker if exists
          ${
            destination
              ? `
          destinationMarker = L.marker([${destination.lat}, ${destination.lng}], {
            icon: L.icon({
              iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2VmNDQ0NCI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3oiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEwIiByPSIzIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            })
          }).addTo(map);
          
          destinationMarker.bindPopup(\`
            <div class="destination-popup">
              <div class="destination-name">DESTINATION</div>
              <div class="destination-address">${destination.address}</div>
            </div>
          \`);
          
          allMarkers.push(destinationMarker);
          `
              : ""
          }
          
          // Function to get routing path using OSRM (free routing service)
          async function getRoutingPath(startLat, startLng, endLat, endLng) {
            try {
              const response = await fetch(\`https://router.project-osrm.org/route/v1/driving/\${startLng},\${startLat};\${endLng},\${endLat}?overview=full&geometries=geojson\`);
              const data = await response.json();
              
              if (data.routes && data.routes.length > 0) {
                return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
              }
            } catch (error) {
              console.log('Routing service unavailable, using straight line');
            }
            
            // Fallback to straight line
            return [[startLat, startLng], [endLat, endLng]];
          }
          
          // Add member markers
          const members = ${JSON.stringify(members)};
          
          // Function to calculate estimated time with accurate distance and speed
          function calculateEstimatedTime(lat1, lng1, lat2, lng2) {
            const R = 6371; // Earth's radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c; // Distance in km
            
            // More realistic speed estimation
            let avgSpeed = 25; // Default city speed
            if (distance > 50) avgSpeed = 40; // Highway for long distance
            else if (distance < 5) avgSpeed = 15; // Local roads for short distance
            
            const timeInHours = distance / avgSpeed;
            const timeInMinutes = Math.round(timeInHours * 60);
            
            if (timeInMinutes < 1) return "< 1 menit";
            if (timeInMinutes < 60) return timeInMinutes + " menit";
            const hours = Math.floor(timeInMinutes / 60);
            const minutes = timeInMinutes % 60;
            return hours + "j " + (minutes > 0 ? minutes + "m" : "");
          }
          
          // Function to get current user location (improved for Indonesia)
          function getCurrentUserLocation() {
            return new Promise((resolve, reject) => {
              if (!navigator.geolocation) {
                console.log('📍 Geolocation not supported, using Indonesia default');
                resolve({
                  lat: -6.2088, // Jakarta default
                  lng: 106.8456,
                  accuracy: 1000
                });
                return;
              }
              
              // First try with high accuracy
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const result = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                  };
                  
                  console.log('📍 Got location:', result);
                  
                  // Check if location is valid (not 0,0 or in middle of ocean)
                  if (isValidLocation(result.lat, result.lng)) {
                    resolve(result);
                  } else {
                    console.log('📍 Invalid location detected, using Indonesia default');
                    resolve({
                      lat: -6.2088, // Jakarta default
                      lng: 106.8456,
                      accuracy: 1000
                    });
                  }
                },
                (error) => {
                  console.log('📍 High accuracy failed:', error.message, 'trying low accuracy...');
                  
                  // Fallback to low accuracy
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const result = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                      };
                      
                      if (isValidLocation(result.lat, result.lng)) {
                        resolve(result);
                      } else {
                        console.log('📍 Low accuracy also invalid, using Indonesia default');
                        resolve({
                          lat: -6.2088,
                          lng: 106.8456,
                          accuracy: 1000
                        });
                      }
                    },
                    (lowAccuracyError) => {
                      console.log('📍 All location attempts failed, using Indonesia default');
                      resolve({
                        lat: -6.2088,
                        lng: 106.8456,
                        accuracy: 1000
                      });
                    },
                    { 
                      enableHighAccuracy: false,
                      timeout: 5000,
                      maximumAge: 300000 
                    }
                  );
                },
                { 
                  enableHighAccuracy: true,
                  timeout: 8000,
                  maximumAge: 60000 
                }
              );
            });
          }
          
          // Check if coordinates are valid
          function isValidLocation(lat, lng) {
            // Check for null, undefined, or 0,0
            if (!lat || !lng || (lat === 0 && lng === 0)) {
              return false;
            }
            
            // Check bounds
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              return false;
            }
            
            // Check if in middle of ocean (common emulator default)
            if (Math.abs(lat) < 1 && Math.abs(lng) < 1) {
              return false;
            }
            
            // Check if it's a common "fake" location (Null Island)
            if (lat === 0 && lng === 0) {
              return false;
            }
            
            return true;
          }
          
          members.forEach(async (member) => {
            if (member.latitude === 0 || member.longitude === 0) return;
            
            const isCurrentUser = member.userId === '${currentUserId}';
            const isAdmin = member.isAdmin;
            
            // Get real location for current user if possible
            let markerLat = member.latitude;
            let markerLng = member.longitude;
            
            if (isCurrentUser) {
              try {
                const realLocation = await getCurrentUserLocation();
                markerLat = realLocation.lat;
                markerLng = realLocation.lng;
                console.log('📍 Using real location for current user:', realLocation);
              } catch (error) {
                console.log('📍 Using stored location for current user');
              }
            }
            
            // Create marker icon based on user type
            let iconData = '';
            if (isCurrentUser) {
              // Green circle for current user
              iconData = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzEwYjk4MSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMxMGI5ODEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIGZpbGw9IndoaXRlIi8+PC9zdmc+';
            } else if (isAdmin) {
              // Orange circle for admin
              iconData = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2Y1OWUwYiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmNTllMGIiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjxwb2x5Z29uIHBvaW50cz0iMTIsNiAxNC4yLDEwLjQgMTksMTAuNyAxNS41LDE0LjYgMTYuNiwxOS40IDEyLDE3IDE3LjQsMTkuNCA4LjUsMTQuNiA1LDEwLjcgOS44LDEwLjQiIGZpbGw9IndoaXRlIi8+PC9zdmc+';
            } else {
              // Blue circle for regular member
              iconData = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNiODJmNiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMzYjgyZjYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTEyIDE0Yy0yLjY3IDAtOCAxLjM0LTggNHY0aDEydi00YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=';
            }
            
            const memberMarker = L.marker([markerLat, markerLng], {
              icon: L.icon({
                iconUrl: 'data:image/svg+xml;base64,' + iconData,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })
            }).addTo(map);
            
            memberMarkers.push(memberMarker);
            allMarkers.push(memberMarker);
            
            if (isCurrentUser) {
              currentUserMarker = memberMarker;
            }
            
            // Create display icon based on user type
            let displayIcon = '';
            if (isCurrentUser) {
              displayIcon = 'YOU';
            } else if (isAdmin) {
              displayIcon = 'ADMIN';
            } else {
              displayIcon = 'MEMBER';
            }
            
            let popupContent = \`
              <div class="member-popup">
                <div class="member-name">\${displayIcon}: \${member.username}</div>
                <div class="member-status">
                  \${isCurrentUser ? 'Your current location' : isAdmin ? 'Room Administrator' : 'Room Member'}
                  \${member.lastUpdated ? '<br>Last seen: ' + new Date(member.lastUpdated.seconds * 1000).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : ''}
                </div>
            \`;
            
            // Calculate and show estimated time to destination (ALWAYS show if destination exists)
            ${
              destination
                ? `
            if (destinationMarker) {
              const estimatedTime = calculateEstimatedTime(markerLat, markerLng, ${destination.lat}, ${destination.lng});
              const etaLabel = isCurrentUser ? 'Your ETA' : 'ETA';
              popupContent += \`<div class="estimated-time">\${etaLabel}: \${estimatedTime}</div>\`;
              
              // Add routing path to destination
              try {
                const routePath = await getRoutingPath(markerLat, markerLng, ${destination.lat}, ${destination.lng});
                const polyline = L.polyline(routePath, {
                  color: isCurrentUser ? '#10b981' : (isAdmin ? '#f59e0b' : '#3b82f6'),
                  weight: 3,
                  opacity: 0.7,
                  dashArray: isCurrentUser ? null : '5, 10'
                }).addTo(map);
                
                polylines.push(polyline);
              } catch (error) {
                console.log('Could not create route for', member.username);
              }
            }
            `
                : ""
            }
            
            popupContent += '</div>';
            
            memberMarker.bindPopup(popupContent);
            
            // Auto-open popup for current user
            if (isCurrentUser) {
              setTimeout(() => memberMarker.openPopup(), 500);
            }
          });
          
          // Control button functions
          window.centerToCurrentUser = function() {
            if (currentUserMarker) {
              map.setView(currentUserMarker.getLatLng(), 16);
              currentUserMarker.openPopup();
              console.log('📍 Centered to current user');
            } else {
              // Fallback: try to get current location
              getCurrentUserLocation().then(location => {
                map.setView([location.lat, location.lng], 16);
                console.log('📍 Centered to real location');
              }).catch(() => {
                console.log('📍 Could not center to user location');
              });
            }
          };
          
          window.centerToDestination = function() {
            if (destinationMarker) {
              map.setView(destinationMarker.getLatLng(), 15);
              destinationMarker.openPopup();
              console.log('🎯 Centered to destination');
            }
          };
          
          window.showAllLocations = function() {
            if (allMarkers.length > 0) {
              const group = new L.featureGroup(allMarkers);
              map.fitBounds(group.getBounds().pad(0.1));
              console.log('🗺️ Showing all locations');
            }
          };
          
          // Initial auto-fit to show all markers
          setTimeout(() => {
            if (allMarkers.length > 1) {
              window.showAllLocations();
            } else if (allMarkers.length === 1) {
              map.setView(allMarkers[0].getLatLng(), 15);
            }
          }, 1000);
          
          console.log('✅ Live Tracking Map initialized successfully');
          
        } catch (error) {
          console.error('❌ Error initializing live tracking map:', error);
          document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Failed to load map: ' + error.message + '</div>';
        }
      </script>
    </body>
    </html>
    `;
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: generateMapHTML() }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onLoadStart={() => console.log("🌐 Live tracking map loading...")}
        onLoadEnd={() => console.log("✅ Live tracking map loaded")}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("❌ LiveTrackingMap WebView error:", nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});
