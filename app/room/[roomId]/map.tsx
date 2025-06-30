import LiveTrackingMap from "@/components/LiveTrackingMap";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDoc,
  onDocSnapshot,
  onQuerySnapshot,
  updateDoc,
} from "@/lib/firebase";
import { LocationData, mapService } from "@/lib/mapService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
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

interface MemberLocation {
  userId: string;
  username: string;
  latitude: number;
  longitude: number;
  lastUpdated: any;
  isAdmin: boolean;
}

export default function RoomMapScreen() {
  const { user } = useAuth();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [members, setMembers] = useState<MemberLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  const [showMembersList, setShowMembersList] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;

    // Get room data
    const unsubscribeRoom = onDocSnapshot("Rooms", roomId, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as RoomData;
        setRoomData(data);
      }
    });

    // Get members locations
    const unsubscribeMembers = onQuerySnapshot(
      "RoomMembers",
      "roomId",
      "==",
      roomId,
      async (snapshot) => {
        const memberPromises = snapshot.docs.map(async (doc) => {
          const memberData = doc.data();
          const userDoc = await getDoc("Users", memberData.userId);
          const userData = userDoc.data();

          return {
            userId: memberData.userId,
            username: userData?.username || "Unknown",
            latitude: memberData.currentLocation?.lat || 0,
            longitude: memberData.currentLocation?.lng || 0,
            lastUpdated: memberData.lastUpdated,
            isAdmin: memberData.userId === roomData?.adminId,
          };
        });

        const membersList = await Promise.all(memberPromises);
        setMembers(
          membersList.filter((m) => m.latitude !== 0 && m.longitude !== 0)
        );
      }
    );

    return () => {
      unsubscribeRoom();
      unsubscribeMembers();
    };
  }, [roomId, user, roomData?.adminId]);

  useEffect(() => {
    // Start location tracking
    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const startLocationTracking = async () => {
    try {
      const subscription = await mapService.watchLocation(
        (location) => {
          setCurrentLocation(location);

          // Update location in Firestore
          updateLocationInFirestore(location);
        },
        (error) => {
          Alert.alert("Location Error", error);
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error("Error starting location tracking:", error);
    }
  };

  const updateLocationInFirestore = async (location: LocationData) => {
    try {
      const memberKey = `${roomId}_${user?.uid}`;
      await updateDoc("RoomMembers", memberKey, {
        currentLocation: {
          lat: location.latitude,
          lng: location.longitude,
        },
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      {/* Header */}
      <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.roomName}>{roomData?.name}</Text>
            <Text style={styles.memberCount}>
              {members.length} member{members.length !== 1 ? "s" : ""} online
            </Text>
          </View>

          <TouchableOpacity
            style={styles.listButton}
            onPress={() => setShowMembersList(!showMembersList)}
          >
            <Ionicons
              name={showMembersList ? "map" : "list"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Map View */}
      {!showMembersList && (
        <View style={styles.mapContainer}>
          <LiveTrackingMap
            members={members}
            destination={roomData?.destination}
            currentUserId={user?.uid || ""}
          />
        </View>
      )}

      {/* Members List View */}
      {showMembersList && (
        <ScrollView style={styles.membersList}>
          {members.map((member) => (
            <View key={member.userId} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <View
                  style={[
                    styles.memberAvatar,
                    member.isAdmin && styles.adminAvatar,
                    member.userId === user?.uid && styles.currentUserAvatar,
                  ]}
                >
                  <Ionicons
                    name={member.isAdmin ? "star" : "person"}
                    size={20}
                    color="white"
                  />
                </View>

                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>
                    {member.username}
                    {member.userId === user?.uid && " (You)"}
                    {member.isAdmin && " 👑"}
                  </Text>

                  <Text style={styles.memberDistance}>
                    {member.userId === user?.uid
                      ? "Current location"
                      : member.lastUpdated
                      ? `Last seen: ${new Date(
                          member.lastUpdated.seconds * 1000
                        ).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Location unknown"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.locateButton}
                onPress={() => {
                  // Close members list to show map
                  setShowMembersList(false);
                }}
              >
                <Ionicons name="location" size={16} color="#6366f1" />
              </TouchableOpacity>
            </View>
          ))}

          {roomData?.destination && (
            <View style={styles.destinationItem}>
              <View style={styles.memberInfo}>
                <View style={styles.destinationAvatar}>
                  <Ionicons name="flag" size={20} color="white" />
                </View>

                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>Destination</Text>
                  <Text style={styles.memberDistance}>
                    {roomData.destination.address}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.locateButton}
                onPress={() => {
                  // Close members list to show map
                  setShowMembersList(false);
                }}
              >
                <Ionicons name="location" size={16} color="#6366f1" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
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
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  roomName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  memberCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  listButton: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  membersList: {
    flex: 1,
    backgroundColor: "white",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "white",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    backgroundColor: "#6366f1",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  adminAvatar: {
    backgroundColor: "#f59e0b",
    shadowColor: "#f59e0b",
  },
  currentUserAvatar: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  memberDistance: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  locateButton: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  destinationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fef2f2",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  destinationAvatar: {
    width: 48,
    height: 48,
    backgroundColor: "#ef4444",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
