import { useAuth } from "@/contexts/AuthContext";
import {
  deleteDoc,
  getDoc,
  onDocSnapshot,
  onQuerySnapshot,
  updateDoc,
} from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
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
  createdAt: any;
  isActive: boolean;
}

interface MemberData {
  userId: string;
  joinedAt: any;
  currentLocation: { lat: number; lng: number };
  lastUpdated: any;
}

interface UserData {
  username: string;
  email: string;
}

export default function RoomScreen() {
  const { user } = useAuth();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [members, setMembers] = useState<(MemberData & UserData)[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;

    const unsubscribeRoom = onDocSnapshot("Rooms", roomId, async (doc) => {
      if (doc.exists()) {
        const data = doc.data() as RoomData;
        setRoomData(data);
        setIsAdmin(data.adminId === user.uid);
      } else {
        Alert.alert("Error", "Room not found");
        router.back();
      }
    });

    const unsubscribeMembers = onQuerySnapshot(
      "RoomMembers",
      "roomId",
      "==",
      roomId,
      async (snapshot) => {
        const memberPromises = snapshot.docs.map(async (doc) => {
          const memberData = doc.data() as MemberData;
          const userDoc = await getDoc("Users", memberData.userId);
          const userData = userDoc.data() as UserData;
          return { ...memberData, ...userData };
        });

        const membersList = await Promise.all(memberPromises);
        setMembers(membersList);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeRoom();
      unsubscribeMembers();
    };
  }, [roomId, user]);

  const handleShareRoom = async () => {
    try {
      await Share.share({
        message: `Join my room "${roomData?.name}" on Im Here!\nRoom Code: ${roomId}\n\nDownload the app and enter this code to see our locations.`,
        title: "Join My Room",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleSetDestination = () => {
    // Navigate to map screen to set destination
    router.push(`/room/${roomId}/set-destination`);
  };

  const handleViewMap = () => {
    // Navigate to live map screen
    router.push(`/room/${roomId}/map`);
  };

  const handleLeaveRoom = () => {
    Alert.alert("Leave Room", "Are you sure you want to leave this room?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            const memberKey = `${roomId}_${user?.uid}`;
            await deleteDoc("RoomMembers", memberKey);

            if (isAdmin) {
              // If admin leaves, deactivate room
              await updateDoc("Rooms", roomId, {
                isActive: false,
              });
            }

            router.back();
          } catch (error) {
            Alert.alert("Error", "Failed to leave room");
          }
        },
      },
    ]);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.headerInfo}>
            <Text style={styles.roomName}>{roomData?.name}</Text>
            <Text style={styles.roomCode}>Code: {roomId}</Text>
          </View>
          <TouchableOpacity
            onPress={handleShareRoom}
            style={styles.shareButton}
          >
            <Ionicons name="share" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Destination Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color="#6366f1" />
            <Text style={styles.cardTitle}>Destination</Text>
          </View>

          {roomData?.destination ? (
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationAddress}>
                {roomData.destination.address}
              </Text>
              <Text style={styles.destinationCoords}>
                {roomData.destination.lat.toFixed(6)},{" "}
                {roomData.destination.lng.toFixed(6)}
              </Text>
            </View>
          ) : (
            <Text style={styles.noDestination}>No destination set</Text>
          )}

          {isAdmin && (
            <TouchableOpacity
              style={styles.setDestinationButton}
              onPress={handleSetDestination}
            >
              <Ionicons name="map" size={16} color="#6366f1" />
              <Text style={styles.setDestinationText}>
                {roomData?.destination
                  ? "Change Destination"
                  : "Set Destination"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Members Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={24} color="#6366f1" />
            <Text style={styles.cardTitle}>Members ({members.length})</Text>
          </View>

          {members.map((member, index) => (
            <View key={member.userId} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <View style={styles.memberAvatar}>
                  <Ionicons name="person" size={20} color="#6366f1" />
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>
                    {member.username}
                    {member.userId === roomData?.adminId && (
                      <Text style={styles.adminBadge}> (Admin)</Text>
                    )}
                  </Text>
                  <Text style={styles.memberStatus}>
                    Last updated:{" "}
                    {new Date(
                      member.lastUpdated?.toDate()
                    ).toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              <View style={styles.memberActions}>
                <Ionicons name="location" size={16} color="#10b981" />
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {roomData?.destination && (
            <TouchableOpacity
              style={styles.viewMapButton}
              onPress={handleViewMap}
            >
              <Ionicons name="map" size={20} color="white" />
              <Text style={styles.viewMapText}>View Live Map</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveRoom}
          >
            <Ionicons name="exit" size={20} color="#dc2626" />
            <Text style={styles.leaveText}>Leave Room</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  roomName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  roomCode: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 12,
  },
  destinationInfo: {
    marginBottom: 16,
  },
  destinationAddress: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  destinationCoords: {
    fontSize: 14,
    color: "#6b7280",
  },
  noDestination: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
    marginBottom: 16,
  },
  setDestinationButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  setDestinationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  adminBadge: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "normal",
  },
  memberStatus: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  memberActions: {
    padding: 8,
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 32,
  },
  viewMapButton: {
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  viewMapText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  leaveButton: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#dc2626",
  },
  leaveText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
