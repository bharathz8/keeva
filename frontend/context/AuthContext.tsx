"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { setApiAuthToken } from "@/lib/api";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isDemoUser: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginAsDemoUser: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  signupWithEmail: async () => {},
  loginAsDemoUser: () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check local storage for persistent demo mode
    const storedDemo = typeof window !== "undefined" ? localStorage.getItem("demo_user_active") : null;
    if (storedDemo === "true") {
      setUser({
        uid: "demo-user-123",
        email: "demo@relationship-intelligence.local",
        displayName: "Demo Reviewer",
        isDemoUser: true
      });
      setApiAuthToken("demo-user-123");
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          setApiAuthToken(token);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            isDemoUser: false
          });
        } else {
          // If not signed in to Firebase and no demo, default to demo user for smooth developer experience
          setUser({
            uid: "demo-user-123",
            email: "demo@relationship-intelligence.local",
            displayName: "Demo User",
            isDemoUser: true
          });
          setApiAuthToken("demo-user-123");
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch {
      // Default to demo mode if Firebase client fails
      setUser({
        uid: "demo-user-123",
        email: "demo@relationship-intelligence.local",
        displayName: "Demo User",
        isDemoUser: true
      });
      setApiAuthToken("demo-user-123");
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    try {
      localStorage.removeItem("demo_user_active");
      const res = await signInWithPopup(auth, googleProvider);
      const token = await res.user.getIdToken();
      setApiAuthToken(token);
    } catch (err: any) {
      console.warn("Firebase Google login error, falling back to demo session:", err);
      loginAsDemoUser();
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      localStorage.removeItem("demo_user_active");
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const token = await res.user.getIdToken();
      setApiAuthToken(token);
    } catch (err: any) {
      console.warn("Firebase email login error:", err);
      throw err;
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    try {
      localStorage.removeItem("demo_user_active");
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const token = await res.user.getIdToken();
      setApiAuthToken(token);
    } catch (err: any) {
      console.warn("Firebase signup error:", err);
      throw err;
    }
  };

  const loginAsDemoUser = () => {
    localStorage.setItem("demo_user_active", "true");
    const demo = {
      uid: "demo-user-123",
      email: "demo@relationship-intelligence.local",
      displayName: "Demo Reviewer",
      isDemoUser: true
    };
    setUser(demo);
    setApiAuthToken("demo-user-123");
  };

  const logout = async () => {
    localStorage.removeItem("demo_user_active");
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setApiAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        loginAsDemoUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
