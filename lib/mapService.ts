import * as Location from "expo-location";

// OpenStreetMap Tile Server - GRATIS!
export const OPENSTREETMAP_TILE_URL =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

// Alternative tile servers (jika OSM lambat)
export const ALTERNATIVE_TILE_SERVERS = {
  // CartoDB - Clean style (more reliable for react-native-maps)
  CARTODB_LIGHT: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",

  // Alternative CartoDB without subdomain
  CARTODB_SIMPLE:
    "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",

  // OpenTopoMap - With topography
  OPENTOPOMAP: "https://tile.opentopomap.org/{z}/{x}/{y}.png",

  // Stamen Terrain (using new Stadia Maps)
  STAMEN_TERRAIN:
    "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png",

  // Simple OSM alternative
  OSM_FRANCE: "https://tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",

  // Additional fallback servers for testing
  WIKIMEDIA: "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png",

  // Simple tile server that should work
  HUMANITARIAN: "https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png",

  // Another reliable option
  CARTO_VOYAGER:
    "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
};

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface RouteData {
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: { latitude: number; longitude: number }[];
}

class MapService {
  // Request location permissions
  async requestLocationPermissions(): Promise<boolean> {
    try {
      console.log("🔐 Requesting location permissions...");

      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        console.log("❌ Foreground location permission denied");
        return false;
      }

      console.log("✅ Foreground location permission granted");

      // Note: We don't request background permission for simplicity
      // Foreground permission is sufficient for map functionality
      // Background permission would require additional setup and Play Store justification

      return true;
    } catch (error) {
      console.error("❌ Error requesting location permissions:", error);
      return false;
    }
  }

  // Get current location with better accuracy and fallback
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      console.log("📍 Getting current location...");

      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        console.log("❌ No location permission, using Indonesia default");
        return this.getIndonesiaDefaultLocation();
      }

      // First try with high accuracy and longer timeout
      try {
        console.log("🎯 Trying high accuracy location...");
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        const result = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          timestamp: location.timestamp,
        };

        console.log("✅ Got high accuracy location:", result);

        // Check if location is reasonable (not in ocean or extreme coordinates)
        if (this.isValidLocation(result.latitude, result.longitude)) {
          return result;
        } else {
          console.log("❌ Location seems invalid, trying balanced accuracy...");
        }
      } catch (highAccuracyError) {
        console.log("⚠️ High accuracy failed, trying balanced accuracy...");
      }

      // Fallback to balanced accuracy with shorter timeout
      try {
        console.log("⚖️ Trying balanced accuracy location...");
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const result = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          timestamp: location.timestamp,
        };

        console.log("✅ Got balanced accuracy location:", result);

        if (this.isValidLocation(result.latitude, result.longitude)) {
          return result;
        } else {
          console.log("❌ Balanced location also invalid, using default...");
        }
      } catch (balancedError) {
        console.log(
          "⚠️ Balanced accuracy also failed, using default location..."
        );
      }

      // Last resort: return Indonesia default location
      console.log("🇮🇩 Using Indonesia default location");
      return this.getIndonesiaDefaultLocation();
    } catch (error) {
      console.error("❌ Error getting current location:", error);
      return this.getIndonesiaDefaultLocation();
    }
  }

  // Check if coordinates are in a reasonable range
  private isValidLocation(latitude: number, longitude: number): boolean {
    // Check if coordinates are not null, undefined, or 0,0 (which often indicates no GPS)
    if (!latitude || !longitude || (latitude === 0 && longitude === 0)) {
      return false;
    }

    // Check if coordinates are within reasonable world bounds
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return false;
    }

    // Check if coordinates are not in the middle of ocean (common GPS error)
    // This is a simple check - if you're actually at sea, you might need to adjust this
    const isInOcean = Math.abs(latitude) < 1 && Math.abs(longitude) < 1;
    if (isInOcean) {
      return false;
    }

    return true;
  }

  // Get default location for Indonesia (Jakarta area)
  private getIndonesiaDefaultLocation(): LocationData {
    return {
      latitude: -6.2088, // Jakarta
      longitude: 106.8456, // Jakarta
      accuracy: 1000, // 1km accuracy to indicate this is approximate
      timestamp: Date.now(),
    };
  }

  // Watch location changes (for real-time tracking)
  async watchLocation(
    callback: (location: LocationData) => void,
    errorCallback?: (error: string) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        errorCallback?.("Location permission not granted");
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: location.timestamp,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error("Error watching location:", error);
      errorCallback?.("Failed to start location tracking");
      return null;
    }
  }

  // Reverse geocoding - Convert coordinates to address
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const parts = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.country,
        ].filter(Boolean);

        return parts.join(", ");
      }

      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  // Forward geocoding - Convert address to coordinates
  async geocode(address: string): Promise<LocationData | null> {
    try {
      const locations = await Location.geocodeAsync(address);

      if (locations.length > 0) {
        const location = locations[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude,
        };
      }

      return null;
    } catch (error) {
      console.error("Error geocoding:", error);
      return null;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Simple ETA calculation (assumes 50 km/h average speed)
  calculateETA(distanceInMeters: number): number {
    const averageSpeedKmh = 50; // km/h
    const distanceInKm = distanceInMeters / 1000;
    const timeInHours = distanceInKm / averageSpeedKmh;
    return Math.round(timeInHours * 60); // Return minutes
  }

  // Get route using OpenRouteService (FREE alternative to Google Directions)
  async getRoute(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
  ): Promise<RouteData | null> {
    try {
      // Using OpenRouteService API (free tier: 2000 requests/day)
      // You need to sign up at https://openrouteservice.org/ for API key
      // For now, we'll use simple straight-line calculation

      const distance = this.calculateDistance(
        startLat,
        startLon,
        endLat,
        endLon
      );
      const duration = this.calculateETA(distance) * 60; // Convert to seconds

      // Simple straight line coordinates (for basic routing)
      const coordinates = [
        { latitude: startLat, longitude: startLon },
        { latitude: endLat, longitude: endLon },
      ];

      return {
        distance,
        duration,
        coordinates,
      };
    } catch (error) {
      console.error("Error getting route:", error);
      return null;
    }
  }
}

export const mapService = new MapService();
export default mapService;
