import { auth, getDoc, serverTimestamp, setDoc } from "@/lib/firebase";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

interface UserData {
  uid: string;
  email: string;
  username?: string;
  createdAt?: any;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(
      "🔧 AuthProvider useEffect triggered - setting up onAuthStateChanged"
    );
    let isMounted = true;

    const unsubscribe = auth().onAuthStateChanged(
      async (firebaseUser: FirebaseAuthTypes.User | null) => {
        console.log(
          "🔥 onAuthStateChanged triggered:",
          firebaseUser ? firebaseUser.uid : "null"
        );
        console.log("🔥 onAuthStateChanged isMounted:", isMounted);
        if (!isMounted) return;

        if (firebaseUser) {
          console.log("📝 Fetching user data for UID:", firebaseUser.uid);
          try {
            // Get user data from Firestore using modular API helper
            const userDoc = await getDoc("Users", firebaseUser.uid);

            if (!isMounted) return;

            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("✅ User data found in Firestore:", userData);
              console.log("🔄 Setting user state...");
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                username: userData?.username,
                createdAt: userData?.createdAt,
              });
              console.log("✅ User state set successfully");
            } else {
              // User exists in Auth but not in Firestore
              console.log(
                "⚠️ User exists in Auth but not in Firestore, creating basic user data"
              );
              console.log("🔄 Setting basic user state...");
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                username: firebaseUser.email?.split("@")[0],
              });
              console.log("✅ Basic user state set successfully");
            }
          } catch (error) {
            console.error("❌ Error fetching user data:", error);

            if (!isMounted) return;

            // Set basic user data from Firebase Auth
            console.log(
              "🔧 Fallback: Setting basic user data from Firebase Auth"
            );
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              username: firebaseUser.email?.split("@")[0],
            });
            console.log("✅ Fallback user state set successfully");
          }
        } else {
          console.log("🚪 User signed out or not authenticated");
          console.log("🔄 Setting user to null...");
          if (isMounted) {
            setUser(null);
          }
          console.log("✅ User state set to null");
        }

        if (isMounted) {
          console.log("🔄 Setting loading to false...");
          setLoading(false);
          console.log("✅ Loading state set to false");
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log("📝 Starting user registration for:", email);

      // 1. Create user with Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // 2. Get the UID from the created user
      const uid = firebaseUser.uid;
      console.log("✅ User created in Auth with UID:", uid);

      // 3. Save user data to Firestore Users collection with UID as document ID
      await setDoc("Users", uid, {
        email: email,
        username: username,
        createdAt: serverTimestamp(),
      });

      console.log("✅ User data saved to Firestore");

      // 4. Sign out the user immediately after registration (no auto-login)
      await auth().signOut();
      console.log("🚪 User signed out after registration");

      console.log("✅ User registration completed successfully");
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔐 Attempting to sign in user:", email);
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password
      );
      console.log("✅ User signed in successfully:", userCredential.user.uid);
      console.log("🔄 onAuthStateChanged should trigger now...");
    } catch (error: any) {
      console.error("❌ Sign in error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
      console.log("User signed out");
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
