import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading]);

  if (loading) {
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
          <Text style={styles.loadingText}>Authenticating...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
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
