import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

interface WebMapProps {
  currentLocation?: { latitude: number; longitude: number } | null;
  selectedLocation?: { latitude: number; longitude: number } | null;
  onLocationSelect: (location: { latitude: number; longitude: number }) => void;
}

export default function WebMap({
  currentLocation,
  selectedLocation,
  onLocationSelect,
}: WebMapProps) {
  const generateMapHTML = () => {
    const lat = currentLocation?.latitude || -6.2088; // Jakarta default
    const lng = currentLocation?.longitude || 106.8456; // Jakarta default
    const selectedLat = selectedLocation?.latitude || lat;
    const selectedLng = selectedLocation?.longitude || lng;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        #map { width: 100%; height: 100vh; }
        .search-container { 
          position: absolute; 
          top: 10px; 
          left: 10px; 
          right: 10px;
          z-index: 1000;
          display: flex;
          gap: 8px;
        }
        .search-input {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: rgba(255,255,255,0.95);
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .search-button {
          padding: 12px 16px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .search-button:hover {
          background: #5145cd;
        }
        .info { 
          position: absolute; 
          bottom: 10px; 
          left: 10px; 
          background: rgba(255,255,255,0.9); 
          padding: 8px 12px; 
          border-radius: 6px;
          z-index: 1000;
          font-size: 12px;
        }
        .search-results {
          position: absolute;
          top: 60px;
          left: 10px;
          right: 10px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          display: none;
        }
        .search-result-item {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
        }
        .search-result-item:hover {
          background: #f8f9fa;
        }
        .search-result-item:last-child {
          border-bottom: none;
        }
        .result-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
        .result-address {
          font-size: 12px;
          color: #666;
        }
      </style>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    </head>
    <body>
      <div class="search-container">
        <input 
          type="text" 
          id="searchInput" 
          class="search-input" 
          placeholder="Cari destinasi atau kota (Jakarta, Bandung, Tangerang Selatan, Bekasi...)"
        />
        <button id="searchButton" class="search-button">🔍</button>
      </div>
      
      <div id="searchResults" class="search-results"></div>
      
      <div class="info">
        <div style="font-weight: bold; color: #6366f1;">📍 ${
          selectedLocation ? "Destinasi Dipilih" : "Jakarta, Indonesia"
        }</div>
        <div style="color: #666;">${
          selectedLocation
            ? "Tap untuk ganti lokasi atau search lainnya"
            : "Search destinasi atau tap map untuk pilih lokasi"
        }</div>
      </div>
      
      <div id="map"></div>
      
      <script>
        try {
          console.log('🗺️ Initializing Jakarta WebView map...');
          
          // Initialize map centered on Jakarta, Indonesia (default) or selected location
          let initialLat = -6.2088; // Jakarta default
          let initialLng = 106.8456; // Jakarta default
          let initialZoom = 12;
          
          // If there's a selected location, use it as center
          if (${selectedLocation ? "true" : "false"}) {
            initialLat = ${selectedLat};
            initialLng = ${selectedLng};
            initialZoom = 15; // Closer zoom for specific destination
          }
          
          const map = L.map('map').setView([initialLat, initialLng], initialZoom);
          
          // Use CartoDB tiles (confirmed working)
          L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            attribution: '© CartoDB © OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
          let currentMarker = null;
          let destinationMarker = null;
          let searchMarkers = [];
          
          // Try to get more accurate current location
          let actualUserLocation = { lat: ${lat}, lng: ${lng} };
          
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                actualUserLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                console.log('📍 Real user location obtained for WebMap:', actualUserLocation);
                
                // Update current marker to real location
                if (currentMarker) {
                  map.removeLayer(currentMarker);
                }
                
                currentMarker = L.marker([actualUserLocation.lat, actualUserLocation.lng], {
                  icon: L.icon({
                    iconUrl: 'data:image/svg+xml;base64,' + btoa(\`
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981">
                        <circle cx="12" cy="12" r="8" fill="#10b981" stroke="white" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                      </svg>
                    \`),
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                  })
                }).addTo(map).bindPopup('📍 Your Real Location');
                
                // If no destination is selected, center on real location
                if (!${selectedLocation ? "true" : "false"}) {
                  map.setView([actualUserLocation.lat, actualUserLocation.lng], 13);
                }
              },
              (error) => {
                console.log('📍 Could not get real location for WebMap:', error.message);
                // Fallback to provided location
                if (${currentLocation ? "true" : "false"}) {
                  currentMarker = L.marker([${lat}, ${lng}], {
                    icon: L.icon({
                      iconUrl: 'data:image/svg+xml;base64,' + btoa(\`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6">
                          <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
                          <circle cx="12" cy="12" r="3" fill="white"/>
                        </svg>
                      \`),
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                    })
                  }).addTo(map).bindPopup('📍 Your Location');
                }
              },
              { 
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 300000 
              }
            );
          } else {
            // Geolocation not supported, use provided location
            if (${currentLocation ? "true" : "false"}) {
              currentMarker = L.marker([${lat}, ${lng}], {
                icon: L.icon({
                  iconUrl: 'data:image/svg+xml;base64,' + btoa(\`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6">
                      <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="3" fill="white"/>
                    </svg>
                  \`),
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })
              }).addTo(map).bindPopup('📍 Your Location');
            }
          }
          
          // Selected destination marker (red)
          if (${selectedLocation ? "true" : "false"}) {
            destinationMarker = L.marker([${selectedLat}, ${selectedLng}], {
              icon: L.icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa(\`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                \`),
                iconSize: [30, 30],
                iconAnchor: [15, 30],
              })
            }).addTo(map).bindPopup('🎯 Destination');
          }
          
          // Search functionality
          const searchInput = document.getElementById('searchInput');
          const searchButton = document.getElementById('searchButton');
          const searchResults = document.getElementById('searchResults');
          
          // Popular destinations in Indonesia
          const popularDestinations = [
            // Jakarta & Sekitarnya
            { name: 'Monas (Monumen Nasional)', address: 'Jakarta Pusat, DKI Jakarta', lat: -6.1754, lng: 106.8272, type: 'landmark' },
            { name: 'Kota Tua Jakarta', address: 'Jakarta Barat, DKI Jakarta', lat: -6.1352, lng: 106.8133, type: 'heritage' },
            { name: 'Ancol Dreamland', address: 'Jakarta Utara, DKI Jakarta', lat: -6.1229, lng: 106.8421, type: 'recreation' },
            { name: 'Grand Indonesia Mall', address: 'Jakarta Pusat, DKI Jakarta', lat: -6.1958, lng: 106.8219, type: 'shopping' },
            { name: 'Ragunan Zoo', address: 'Jakarta Selatan, DKI Jakarta', lat: -6.3111, lng: 106.8205, type: 'recreation' },
            { name: 'Istiqlal Mosque', address: 'Jakarta Pusat, DKI Jakarta', lat: -6.1702, lng: 106.8316, type: 'religious' },
            
            // Tangerang & Bekasi
            { name: 'Ocean Park BSD', address: 'Tangerang Selatan, Banten', lat: -6.3122, lng: 106.6519, type: 'recreation' },
            { name: 'Summarecon Mall Serpong', address: 'Tangerang Selatan, Banten', lat: -6.2414, lng: 106.6618, type: 'shopping' },
            { name: 'Scientia Square Park', address: 'Tangerang Selatan, Banten', lat: -6.2571, lng: 106.6175, type: 'recreation' },
            { name: 'Mal Bekasi Cyber Park', address: 'Bekasi, Jawa Barat', lat: -6.2382, lng: 106.9929, type: 'shopping' },
            { name: 'Venetian Water Carnaval', address: 'Bekasi, Jawa Barat', lat: -6.2264, lng: 107.0014, type: 'recreation' },
            { name: 'Go! Wet Waterpark', address: 'Bekasi, Jawa Barat', lat: -6.2051, lng: 107.0017, type: 'recreation' },
            
            // Bogor & Depok
            { name: 'Kebun Raya Bogor', address: 'Bogor, Jawa Barat', lat: -6.5971, lng: 106.7999, type: 'nature' },
            { name: 'Taman Safari Indonesia', address: 'Bogor, Jawa Barat', lat: -6.7072, lng: 106.9495, type: 'recreation' },
            { name: 'Puncak Pass', address: 'Bogor, Jawa Barat', lat: -6.7026, lng: 106.9718, type: 'nature' },
            { name: 'Margonda Town Square', address: 'Depok, Jawa Barat', lat: -6.3766, lng: 106.8324, type: 'shopping' },
            
            // Bandung
            { name: 'Gedung Sate', address: 'Bandung, Jawa Barat', lat: -6.9024, lng: 107.6186, type: 'landmark' },
            { name: 'Tangkuban Perahu', address: 'Lembang, Bandung Barat', lat: -6.7597, lng: 107.6098, type: 'nature' },
            { name: 'Kawah Putih', address: 'Ciwidey, Bandung Selatan', lat: -7.1660, lng: 107.4023, type: 'nature' },
            { name: 'Braga Street', address: 'Bandung, Jawa Barat', lat: -6.9218, lng: 107.6069, type: 'shopping' },
            { name: 'Trans Studio Bandung', address: 'Bandung, Jawa Barat', lat: -6.9258, lng: 107.6372, type: 'recreation' },
            { name: 'Farmhouse Lembang', address: 'Lembang, Bandung Barat', lat: -6.8063, lng: 107.6177, type: 'recreation' },
            
            // Bali
            { name: 'Tanah Lot', address: 'Tabanan, Bali', lat: -8.6211, lng: 115.0869, type: 'temple' },
            { name: 'Ubud Rice Terraces', address: 'Ubud, Bali', lat: -8.4289, lng: 115.2840, type: 'nature' },
            { name: 'Kuta Beach', address: 'Kuta, Bali', lat: -8.7186, lng: 115.1689, type: 'beach' },
            { name: 'Uluwatu Temple', address: 'Uluwatu, Bali', lat: -8.8290, lng: 115.0840, type: 'temple' },
            { name: 'Seminyak Beach', address: 'Seminyak, Bali', lat: -8.6835, lng: 115.1568, type: 'beach' },
            { name: 'Mount Batur', address: 'Bangli, Bali', lat: -8.2422, lng: 115.3750, type: 'nature' },
            
            // Yogyakarta  
            { name: 'Candi Borobudur', address: 'Magelang, Jawa Tengah', lat: -7.6079, lng: 110.2038, type: 'heritage' },
            { name: 'Malioboro Street', address: 'Yogyakarta', lat: -7.7956, lng: 110.3695, type: 'shopping' },
            { name: 'Candi Prambanan', address: 'Sleman, Yogyakarta', lat: -7.7520, lng: 110.4915, type: 'heritage' },
            { name: 'Taman Sari Water Castle', address: 'Yogyakarta', lat: -7.8059, lng: 110.3590, type: 'heritage' },
            
            // Surabaya & Jawa Timur
            { name: 'House of Sampoerna', address: 'Surabaya, Jawa Timur', lat: -7.2459, lng: 112.7378, type: 'museum' },
            { name: 'Tugu Pahlawan', address: 'Surabaya, Jawa Timur', lat: -7.2459, lng: 112.7378, type: 'landmark' },
            { name: 'Jatim Park', address: 'Malang, Jawa Timur', lat: -7.8914, lng: 112.5927, type: 'recreation' },
            { name: 'Bromo Tengger Semeru', address: 'Malang, Jawa Timur', lat: -7.9425, lng: 112.9530, type: 'nature' },
            
            // Semarang & Jawa Tengah
            { name: 'Lawang Sewu', address: 'Semarang, Jawa Tengah', lat: -6.9837, lng: 110.4203, type: 'heritage' },
            { name: 'Kota Lama Semarang', address: 'Semarang, Jawa Tengah', lat: -6.9678, lng: 110.4203, type: 'heritage' },
            { name: 'Candi Gedong Songo', address: 'Semarang, Jawa Tengah', lat: -7.2050, lng: 110.3396, type: 'heritage' },
            
            // Lombok & NTB
            { name: 'Pantai Senggigi', address: 'Lombok, Nusa Tenggara Barat', lat: -8.4881, lng: 116.0426, type: 'beach' },
            { name: 'Gunung Rinjani', address: 'Lombok, Nusa Tenggara Barat', lat: -8.4118, lng: 116.4574, type: 'nature' },
            { name: 'Gili Trawangan', address: 'Lombok, Nusa Tenggara Barat', lat: -8.3533, lng: 116.0275, type: 'beach' },
            
            // Medan & Sumatra Utara
            { name: 'Istana Maimun', address: 'Medan, Sumatra Utara', lat: 3.5707, lng: 98.6850, type: 'heritage' },
            { name: 'Danau Toba', address: 'Sumatra Utara', lat: 2.6845, lng: 98.8756, type: 'nature' },
            { name: 'Bukit Lawang', address: 'Sumatra Utara', lat: 3.5577, lng: 98.1341, type: 'nature' },
            
            // Cities & Provinces for general search
            { name: 'Jakarta', address: 'DKI Jakarta', lat: -6.2088, lng: 106.8456, type: 'city' },
            { name: 'Bandung', address: 'Jawa Barat', lat: -6.9175, lng: 107.6191, type: 'city' },
            { name: 'Surabaya', address: 'Jawa Timur', lat: -7.2575, lng: 112.7521, type: 'city' },
            { name: 'Yogyakarta', address: 'Daerah Istimewa Yogyakarta', lat: -7.7956, lng: 110.3695, type: 'city' },
            { name: 'Semarang', address: 'Jawa Tengah', lat: -6.9932, lng: 110.4203, type: 'city' },
            { name: 'Medan', address: 'Sumatra Utara', lat: 3.5952, lng: 98.6722, type: 'city' },
            { name: 'Denpasar', address: 'Bali', lat: -8.6705, lng: 115.2126, type: 'city' },
            { name: 'Tangerang Selatan', address: 'Banten', lat: -6.2884, lng: 106.6710, type: 'city' },
            { name: 'Bekasi', address: 'Jawa Barat', lat: -6.2383, lng: 106.9756, type: 'city' },
            { name: 'Bogor', address: 'Jawa Barat', lat: -6.5971, lng: 106.8060, type: 'city' },
            { name: 'Depok', address: 'Jawa Barat', lat: -6.4025, lng: 106.7942, type: 'city' },
            { name: 'Tangerang', address: 'Banten', lat: -6.1783, lng: 106.6319, type: 'city' }
          ];
          
          function searchDestinations(query) {
            console.log('🔍 Searching for:', query);
            
            if (!query || query.length < 2) {
              searchResults.style.display = 'none';
              return;
            }
            
            const filtered = popularDestinations.filter(dest => 
              dest.name.toLowerCase().includes(query.toLowerCase()) ||
              dest.address.toLowerCase().includes(query.toLowerCase()) ||
              dest.type.toLowerCase().includes(query.toLowerCase()) ||
              // Enhanced search for cities and provinces
              (query.toLowerCase().includes('jakarta') && dest.address.toLowerCase().includes('jakarta')) ||
              (query.toLowerCase().includes('bandung') && dest.address.toLowerCase().includes('bandung')) ||
              (query.toLowerCase().includes('tangerang') && dest.address.toLowerCase().includes('tangerang')) ||
              (query.toLowerCase().includes('bekasi') && dest.address.toLowerCase().includes('bekasi')) ||
              (query.toLowerCase().includes('bogor') && dest.address.toLowerCase().includes('bogor')) ||
              (query.toLowerCase().includes('depok') && dest.address.toLowerCase().includes('depok')) ||
              (query.toLowerCase().includes('bali') && dest.address.toLowerCase().includes('bali')) ||
              (query.toLowerCase().includes('yogya') && dest.address.toLowerCase().includes('yogya')) ||
              (query.toLowerCase().includes('surabaya') && dest.address.toLowerCase().includes('surabaya')) ||
              (query.toLowerCase().includes('medan') && dest.address.toLowerCase().includes('medan'))
            );
            
            if (filtered.length === 0) {
              searchResults.innerHTML = '<div class="search-result-item"><div class="result-name">Tidak ditemukan</div><div class="result-address">Coba kata kunci seperti "Jakarta", "Bandung", "Tangerang Selatan", "Bekasi"</div></div>';
              searchResults.style.display = 'block';
              return;
            }
            
            // Sort results: cities first, then popular destinations
            filtered.sort((a, b) => {
              if (a.type === 'city' && b.type !== 'city') return -1;
              if (a.type !== 'city' && b.type === 'city') return 1;
              return 0;
            });
            
            searchResults.innerHTML = filtered.map(dest => \`
              <div class="search-result-item" onclick="selectDestination(\${dest.lat}, \${dest.lng}, '\${dest.name}')">
                <div class="result-name">\${getTypeIcon(dest.type)} \${dest.name}</div>
                <div class="result-address">\${dest.address}</div>
              </div>
            \`).join('');
            
            searchResults.style.display = 'block';
          }
          
          function getTypeIcon(type) {
            const icons = {
              landmark: '🏛️',
              heritage: '🏯', 
              nature: '🌿',
              beach: '🏖️',
              temple: '⛩️',
              shopping: '🛍️',
              recreation: '🎢',
              museum: '🏛️',
              religious: '🕌',
              city: '🏙️'
            };
            return icons[type] || '📍';
          }
          
          function selectDestination(lat, lng, name) {
            console.log('📍 Selected destination:', name, lat, lng);
            
            // Remove existing destination marker
            if (destinationMarker) {
              map.removeLayer(destinationMarker);
            }
            
            // Add new destination marker
            destinationMarker = L.marker([lat, lng], {
              icon: L.icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa(\`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                \`),
                iconSize: [30, 30],
                iconAnchor: [15, 30],
              })
            }).addTo(map).bindPopup('🎯 ' + name);
            
            // Auto-focus: Determine appropriate zoom level based on destination type
            let zoomLevel = 15; // default for specific places
            const isCity = name.toLowerCase().includes('jakarta') || 
                          name.toLowerCase().includes('bandung') || 
                          name.toLowerCase().includes('surabaya') ||
                          name.toLowerCase().includes('tangerang') ||
                          name.toLowerCase().includes('bekasi') ||
                          name === 'Jakarta' || name === 'Bandung' || 
                          name === 'Surabaya' || name === 'Yogyakarta' ||
                          name === 'Tangerang Selatan' || name === 'Bekasi' ||
                          name === 'Bogor' || name === 'Depok';
            
            if (isCity) {
              zoomLevel = 12; // Wider view for cities
            }
            
            // Center map on selected destination with appropriate zoom
            map.setView([lat, lng], zoomLevel);
            
            // Show popup automatically
            destinationMarker.openPopup();
            
            // Hide search results
            searchResults.style.display = 'none';
            searchInput.value = name;
            
            // Send location back to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelect',
                latitude: lat,
                longitude: lng,
                name: name
              }));
            }
          }
          
          // Search event listeners
          searchButton.onclick = () => {
            searchDestinations(searchInput.value);
          };
          
          searchInput.onkeyup = (e) => {
            if (e.key === 'Enter') {
              searchDestinations(searchInput.value);
            } else {
              // Real-time search
              setTimeout(() => searchDestinations(searchInput.value), 300);
            }
          };
          
          // Click outside to hide search results
          document.onclick = (e) => {
            if (!e.target.closest('.search-container') && !e.target.closest('.search-results')) {
              searchResults.style.display = 'none';
            }
          };
          
          // Handle map clicks for custom destination selection
          map.on('click', function(e) {
            console.log('🗺️ Map clicked at:', e.latlng);
            
            // Remove existing destination marker
            if (destinationMarker) {
              map.removeLayer(destinationMarker);
            }
            
            // Add new destination marker
            destinationMarker = L.marker([e.latlng.lat, e.latlng.lng], {
              icon: L.icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa(\`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                \`),
                iconSize: [30, 30],
                iconAnchor: [15, 30],
              })
            }).addTo(map).bindPopup('🎯 Custom Location');
            
            // Auto-focus on clicked location with medium zoom
            map.setView([e.latlng.lat, e.latlng.lng], 16);
            
            // Show popup automatically
            destinationMarker.openPopup();
            
            // Clear search input
            searchInput.value = '';
            searchResults.style.display = 'none';
            
            // Send location back to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelect',
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
                name: 'Custom Location'
              }));
            }
          });
          
          console.log('✅ Jakarta WebView map with search initialized successfully');
          
        } catch (error) {
          console.error('❌ Error initializing map:', error);
          document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Failed to load map: ' + error.message + '</div>';
        }
      </script>
    </body>
    </html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "locationSelect") {
        console.log("📍 Location selected via WebView:", data);
        onLocationSelect({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error("WebView message error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: generateMapHTML() }}
        style={styles.webView}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onLoadStart={() => console.log("🌐 WebView map loading...")}
        onLoadEnd={() => console.log("✅ WebView map loaded")}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("❌ WebView error:", nativeEvent);
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
