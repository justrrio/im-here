import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function IndexScreen() {
  const { user, loading } = useAuth();

  console.log(
    "🏠 Index screen render - User:",
    user ? `${user.uid} (${user.email})` : "null",
    "Loading:",
    loading
  );

  useEffect(() => {
    console.log(
      "🏠 Index screen useEffect - User state:",
      user ? `${user.uid} (${user.email})` : "null"
    );
    console.log("🏠 Index screen useEffect - Loading state:", loading);
  }, [user, loading]);

  if (loading) {
    console.log("⏳ Index screen showing loading spinner");
    return (
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#a855f7"]}
        style={styles.container}
      >
        <View style={styles.logoContainer}>
          <Ionicons name="location" size={80} color="white" />
          <Text style={styles.appName}>I'm Here</Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  // If user is authenticated, redirect to tabs
  if (user) {
    console.log("✅ Index screen redirecting to /(tabs) for user:", user.uid);
    return <Redirect href="/(tabs)" />;
  }

  // If not authenticated, redirect to login
  console.log("🔑 Index screen redirecting to /login (no user)");
  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 80,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "white",
    marginTop: 16,
    opacity: 0.8,
  },
});
