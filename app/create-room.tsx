import { useAuth } from "@/contexts/AuthContext";
import { getDoc, serverTimestamp, setDoc } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateRoomScreen() {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const generateRoomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert("Error", "Please enter a room name");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    console.log("🏠 === CREATE ROOM DEBUG START ===");
    console.log("📝 Room name:", roomName.trim());
    console.log("👤 User:", user.uid);

    setLoading(true);
    try {
      let roomCode = generateRoomCode();
      
      // Check if room code already exists
      let roomExists = true;
      while (roomExists) {
        const existingRoom = await getDoc("Rooms", roomCode);
        if (!existingRoom.exists()) {
          roomExists = false;
        } else {
          roomCode = generateRoomCode();
        }
      }

      console.log("🔑 Generated unique room code:", roomCode);

      // Create room document
      await setDoc("Rooms", roomCode, {
        id: roomCode,
        name: roomName.trim(),
        description: roomDescription.trim() || "Let's meet up!",
        adminId: user.uid,
        adminUsername: user.username || "Admin",
        createdAt: serverTimestamp(),
        destination: null,
        isActive: true,
        memberCount: 1,
      });

      console.log("✅ Room created successfully");

      // Add creator as first member
      const memberKey = `${roomCode}_${user.uid}`;
      await setDoc("RoomMembers", memberKey, {
        roomId: roomCode,
        userId: user.uid,
        username: user.username || "Unknown",
        email: user.email || "",
        joinedAt: serverTimestamp(),
        isActive: true,
        role: "admin",
      });

      console.log("✅ Admin added as member successfully");
      console.log("🏠 === CREATE ROOM DEBUG END ===");

      // Navigate to room
      Alert.alert(
        "Room Created!",
        `Your room "${roomName}" has been created with code: ${roomCode}`,
        [
          {
            text: "Enter Room",
            onPress: () => router.replace(`/room/${roomCode}`),
          },
        ]
      );
    } catch (error) {
      console.error("❌ Error creating room:", error);
      Alert.alert("Error", "Failed to create room. Please try again.");
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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Modern Header */}
        <LinearGradient
          colors={["#6366f1", "#8b5cf6", "#a855f7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={styles.logoContainer}>
                <Ionicons name="add-circle" size={32} color="white" />
              </View>
              <Text style={styles.headerTitle}>Create Room</Text>
              <Text style={styles.headerSubtitle}>
                Start a new location sharing session
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Create Room Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="people" size={24} color="#10b981" />
              </View>
              <Text style={styles.cardTitle}>Room Details</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="bookmark-outline"
                size={20}
                color="#9ca3af"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter room name (e.g., Weekend Hangout)"
                placeholderTextColor="#9ca3af"
                value={roomName}
                onChangeText={setRoomName}
                maxLength={50}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#9ca3af"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a description (optional)"
                placeholderTextColor="#9ca3af"
                value={roomDescription}
                onChangeText={setRoomDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.disabledButton]}
              onPress={handleCreateRoom}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.createButtonText}>
                {loading ? "Creating Room..." : "Create Room"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features Info */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>What happens next?</Text>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="key" size={20} color="#6366f1" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Get Room Code</Text>
                <Text style={styles.featureDescription}>
                  A unique 6-character code will be generated for your room
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="share" size={20} color="#10b981" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Share with Friends</Text>
                <Text style={styles.featureDescription}>
                  Share the room code with friends so they can join
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="location" size={20} color="#f59e0b" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Set Destination</Text>
                <Text style={styles.featureDescription}>
                  Choose a meetup location and track everyone's progress
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="people" size={20} color="#ef4444" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Real-time Tracking</Text>
                <Text style={styles.featureDescription}>
                  See everyone's live location and estimated arrival times
                </Text>
              </View>
            </View>
          </View>

          {/* Admin Info */}
          <View style={styles.adminCard}>
            <View style={styles.adminHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              <Text style={styles.adminTitle}>You'll be the Room Admin</Text>
            </View>
            <Text style={styles.adminDescription}>
              As the room creator, you can manage the room, set destinations, 
              and remove members if needed.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContent: {
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerCenter: {
    alignItems: "center",
    marginTop: 20,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    marginTop: -20,
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
    marginBottom: 24,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#bbf7d0",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    marginTop: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    paddingVertical: 16,
    fontWeight: "500",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  createButton: {
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
  createButtonText: {
    color: "white",
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
  featuresCard: {
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
  featuresTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#e0e7ff",
  },
  featureContent: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  featureDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  adminCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "#bbf7d0",
  },
  adminHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#065f46",
    marginLeft: 12,
    letterSpacing: 0.2,
  },
  adminDescription: {
    fontSize: 14,
    color: "#047857",
    lineHeight: 20,
  },
});
