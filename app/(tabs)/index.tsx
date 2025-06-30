import { useAuth } from "@/contexts/AuthContext";
import { getDoc, getDocsWhere, setDoc, updateDoc } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState, useRef } from "react";
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [checkingRoom, setCheckingRoom] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check if user is already in an active room - run every time screen is focused
  useFocusEffect(
    useCallback(() => {
      checkUserActiveRoom();
      // Animate features card
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, [user, fadeAnim])
  );

  const checkUserActiveRoom = async () => {
    if (!user) {
      setCheckingRoom(false);
      return;
    }

    try {
      setCheckingRoom(true);
      console.log("🔍 Checking user active room for:", user.uid);

      // Reset current room first
      setCurrentRoom(null);

      // Check if user is in any active room
      const memberSnapshot = await getDocsWhere(
        "RoomMembers",
        "userId",
        "==",
        user.uid
      );

      if (!memberSnapshot.empty) {
        console.log("📋 Found member records:", memberSnapshot.size);

        // Find active member record
        let activeMemberData = null;
        let activeRoomId = null;

        memberSnapshot.forEach((doc) => {
          const memberData = doc.data();
          console.log("📄 Member data:", memberData);

          if (memberData.isActive) {
            console.log("✅ Found active member record");
            activeMemberData = memberData;
            activeRoomId = memberData.roomId;
          }
        });

        if (activeMemberData && activeRoomId) {
          console.log("🎯 User is active in room:", activeRoomId);

          // Get room details
          const roomDoc = await getDoc("Rooms", activeRoomId);
          if (roomDoc.exists()) {
            const roomData = roomDoc.data();
            console.log("🏠 Room data:", roomData);

            setCurrentRoom({
              id: activeRoomId,
              ...roomData,
              memberData: activeMemberData,
            });
          } else {
            console.log("❌ Room not found, deactivating member");
            // Room doesn't exist, deactivate member
            const memberKey = `${activeRoomId}_${user.uid}`;
            await updateDoc("RoomMembers", memberKey, {
              isActive: false,
              leftAt: new Date(),
            });
          }
        } else {
          console.log("📝 No active member records found");
        }
      } else {
        console.log("📋 No member records found for user");
      }
    } catch (error) {
      console.error("❌ Error checking user active room:", error);
    } finally {
      setCheckingRoom(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom || !user) return;

    Alert.alert(
      "Leave Room",
      `Are you sure you want to leave "${currentRoom.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              console.log("🚪 Leaving room:", currentRoom.id);

              // Update member status to inactive
              const memberKey = `${currentRoom.id}_${user.uid}`;
              await updateDoc("RoomMembers", memberKey, {
                leftAt: new Date(),
                isActive: false,
              });

              console.log("✅ Successfully left room");

              // Clear current room state immediately
              setCurrentRoom(null);

              Alert.alert("Success", "You have left the room successfully.");
            } catch (error) {
              console.error("❌ Error leaving room:", error);
              Alert.alert("Error", "Failed to leave room. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !user) {
      Alert.alert("Error", "Please enter a valid room code");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Attempting to join room:", roomCode.trim().toUpperCase());

      // Check if room exists
      const roomDoc = await getDoc("Rooms", roomCode.trim().toUpperCase());
      if (!roomDoc.exists()) {
        Alert.alert(
          "Room Not Found",
          "Please check the room code and try again."
        );
        return;
      }

      const roomData = roomDoc.data();
      console.log("🏠 Room found:", roomData);

      // Check if user is already a member of this room
      const memberKey = `${roomCode.trim().toUpperCase()}_${user.uid}`;
      const memberDoc = await getDoc("RoomMembers", memberKey);

      if (memberDoc.exists()) {
        console.log("👤 User was already a member, reactivating...");
        // User was already a member, reactivate them
        await updateDoc("RoomMembers", memberKey, {
          isActive: true,
          rejoinedAt: new Date(),
        });
      } else {
        console.log("👤 Adding user as new member...");
        // Add user as a new member
        await setDoc("RoomMembers", memberKey, {
          roomId: roomCode.trim().toUpperCase(),
          userId: user.uid,
          username: user.username || "Unknown",
          email: user.email || "",
          joinedAt: new Date(),
          isActive: true,
          role: "member",
        });
      }

      console.log("✅ Successfully joined room");
      setRoomCode("");

      // Refresh room check
      await checkUserActiveRoom();

      Alert.alert(
        "Success",
        `You have joined "${roomData?.name || "the room"}" successfully!`
      );
    } catch (error) {
      console.error("❌ Error joining room:", error);
      Alert.alert("Error", "Failed to join room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    router.push("/create-room");
  };

  const handleEnterRoom = () => {
    if (currentRoom) {
      router.push(`/room/${currentRoom.id}`);
    }
  };

  const handleProfilePress = () => {
    router.push("/(tabs)/profile");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "Good Night";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "moon";
    if (hour < 12) return "sunny";
    if (hour < 17) return "partly-sunny";
    if (hour < 21) return "cloudy";
    return "moon";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      {/* Ultra Modern Header with Advanced Design */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#a855f7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Background decorations */}
        <View style={styles.headerDecoration} />
        <View style={styles.headerWave} />
        <View style={styles.headerPattern} />

        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <View style={styles.greetingBadge}>
              <Ionicons name={getGreetingIcon()} size={16} color="#fbbf24" />
              <Text style={styles.greeting}>{getGreeting()}</Text>
            </View>
            <Text style={styles.username}>{user?.username || "User"}! 👋</Text>
            <Text style={styles.subtitle}>Ready for your next adventure?</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            <View style={styles.profileButtonInner}>
              <Ionicons name="person" size={20} color="white" />
            </View>
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        scrollEventThrottle={16}
      >
        {checkingRoom ? (
          /* Loading State */
          <View style={styles.card}>
            <View style={styles.loadingContainer}>
              <View style={styles.loadingIcon}>
                <Ionicons name="hourglass" size={32} color="#6366f1" />
              </View>
              <Text style={styles.loadingText}>Checking your rooms...</Text>
            </View>
          </View>
        ) : currentRoom ? (
          /* User is in an active room */
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="people" size={24} color="#10b981" />
              </View>
              <Text style={styles.cardTitle}>Current Room</Text>
            </View>

            <View style={styles.currentRoomContainer}>
              <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{currentRoom.name}</Text>
                <View style={styles.roomCodeContainer}>
                  <Text style={styles.roomCode}>{currentRoom.id}</Text>
                </View>
                <Text style={styles.roomDescription}>
                  {currentRoom.description ||
                    "Join your friends and start sharing locations for your meetup!"}
                </Text>

                <View style={styles.roomMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text style={styles.metaText}>
                      Joined:{" "}
                      {new Date(
                        currentRoom.memberData.joinedAt?.seconds * 1000
                      ).toLocaleDateString("id-ID")}
                    </Text>
                  </View>

                  {currentRoom.destination && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location" size={16} color="#ef4444" />
                      <Text style={styles.metaText}>
                        Destination:{" "}
                        {currentRoom.destination.address || "Set destination"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.roomActions}>
                <TouchableOpacity
                  style={styles.enterRoomButton}
                  onPress={handleEnterRoom}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="enter"
                    size={20}
                    color="white"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.enterRoomButtonText}>Enter Room</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.leaveRoomButton}
                  onPress={handleLeaveRoom}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="exit"
                    size={20}
                    color="#ef4444"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.leaveRoomButtonText}>
                    {loading ? "Leaving..." : "Leave Room"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* User is not in any room - show join/create options */
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="location" size={24} color="#6366f1" />
              </View>
              <Text style={styles.cardTitle}>Join or Create Room</Text>
            </View>

            {/* Join Room Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Join a Room</Text>
              <Text style={styles.sectionDescription}>
                Enter the room code shared by your friend to join their location
                sharing session.
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="key"
                  size={20}
                  color="#9ca3af"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter room code"
                  placeholderTextColor="#9ca3af"
                  value={roomCode}
                  onChangeText={setRoomCode}
                  autoCapitalize="characters"
                  maxLength={8}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleJoinRoom}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="enter"
                  size={20}
                  color="white"
                  style={styles.buttonIcon}
                />
                <Text style={styles.primaryButtonText}>
                  {loading ? "Joining..." : "Join Room"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Create Room Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create New Room</Text>
              <Text style={styles.sectionDescription}>
                Start a new room and invite friends to share locations for your
                meetup.
              </Text>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCreateRoom}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color="#6366f1"
                  style={styles.buttonIcon}
                />
                <Text style={styles.secondaryButtonText}>Create Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Modern Features Info */}
        <Animated.View
          style={[
            styles.featuresCard,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.featuresTitle}>How It Works</Text>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="add-circle" size={20} color="#6366f1" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Create or Join Room</Text>
              <Text style={styles.featureDescription}>
                Start a new room or join an existing one with a room code
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="navigate" size={20} color="#10b981" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Share Your Location</Text>
              <Text style={styles.featureDescription}>
                Real-time location sharing with friends and family
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="flag" size={20} color="#f59e0b" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Set Destination</Text>
              <Text style={styles.featureDescription}>
                Choose a meetup point and see everyone's progress
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.featureItem,
              { borderBottomWidth: 0, marginBottom: 0 },
            ]}
          >
            <View style={styles.featureIcon}>
              <Ionicons name="speedometer" size={20} color="#ef4444" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Track ETA</Text>
              <Text style={styles.featureDescription}>
                Get estimated arrival times and live tracking updates
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    position: "relative",
    overflow: "hidden",
  },
  headerDecoration: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  headerWave: {
    position: "absolute",
    bottom: -20,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  headerPattern: {
    position: "absolute",
    top: 10,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 1,
  },
  greetingContainer: {
    flex: 1,
    paddingRight: 16,
  },
  greetingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  greeting: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.95)",
    marginLeft: 6,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  username: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  profileButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  profileButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "white",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#e0e7ff",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    paddingVertical: 16,
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: "#f0f4ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e7ff",
  },
  secondaryButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
    letterSpacing: 1,
  },
  featuresCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 24,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#e0e7ff",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureContent: {
    flex: 1,
    paddingTop: 4,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  featureDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  currentRoomContainer: {
    marginTop: 8,
  },
  roomInfo: {
    marginBottom: 24,
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  roomName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  roomCodeContainer: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  roomCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
    backgroundColor: "#f0f4ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roomDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  roomMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  roomActions: {
    gap: 12,
  },
  enterRoomButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  enterRoomButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  leaveRoomButton: {
    backgroundColor: "#fef2f2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fecaca",
  },
  leaveRoomButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
