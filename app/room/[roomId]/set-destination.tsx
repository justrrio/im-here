import WebMap from "@/components/WebMap";
import { useAuth } from "@/contexts/AuthContext";
import { onDocSnapshot, updateDoc } from "@/lib/firebase";
import { LocationData, mapService } from "@/lib/mapService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface RoomData {
  name: string;
  adminId: string;
  destination: { lat: number; lng: number; address: string } | null;
  isActive: boolean;
}

export default function SetDestinationScreen() {
  const { user } = useAuth();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;

    // Get room data
    const unsubscribe = onDocSnapshot("Rooms", roomId, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as RoomData;
        setRoomData(data);

        // If destination already exists, set as selected
        if (data.destination) {
          setSelectedLocation({
            latitude: data.destination.lat,
            longitude: data.destination.lng,
          });
        }
      }
    });

    // Get current location
    getCurrentLocation();

    return unsubscribe;
  }, [roomId, user]);

  const getCurrentLocation = async () => {
    const location = await mapService.getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
    }
  };

  const handleSetDestination = async () => {
    if (!selectedLocation || !roomId) {
      Alert.alert("Error", "Please select a location on the map");
      return;
    }

    setLoading(true);
    try {
      // Get address for the location
      const address = await mapService.reverseGeocode(
        selectedLocation.latitude,
        selectedLocation.longitude
      );

      // Update room destination
      await updateDoc("Rooms", roomId, {
        destination: {
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
          address: address,
        },
      });

      Alert.alert("Success!", "Destination has been set successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error setting destination:", error);
      Alert.alert("Error", "Failed to set destination. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      {/* Header */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#a855f7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Destination</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={20} color="#6366f1" />
          <Text style={styles.instructionText}>
            Search destinasi wisata atau tap pada map untuk memilih lokasi
            tujuan group
          </Text>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <WebMap
            currentLocation={currentLocation}
            selectedLocation={selectedLocation}
            onLocationSelect={(location) => {
              setSelectedLocation(location);
              console.log("📍 Location selected from WebMap:", location);
            }}
          />
        </View>

        {/* Action Button */}
        {selectedLocation && (
          <TouchableOpacity
            style={[styles.setButton, loading && styles.disabledButton]}
            onPress={handleSetDestination}
            disabled={loading}
          >
            <Ionicons
              name="checkmark"
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.setButtonText}>
              {loading ? "Setting Destination..." : "Set as Destination"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  placeholder: {
    width: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  instructionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  instructionText: {
    marginLeft: 16,
    fontSize: 15,
    color: "#6b7280",
    flex: 1,
    lineHeight: 22,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  setButton: {
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  setButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
});
