"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onIdTokenChanged, 
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
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  authModalMode: "signin" | "signup";
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  signupWithEmail: async () => {},
  logout: async () => {},
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  authModalMode: "signin",
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");

  const openAuthModal = (mode: "signin" | "signup" = "signin") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    // Clean up any legacy demo state from previous sessions
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_user_active");
      localStorage.removeItem("keeva_logged_out");
    }

    try {
      const unsubscribe = onIdTokenChanged(auth, async (firebaseUser: User | null) => {
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken();
            if (!idToken) {
              throw new Error("Empty JWT token");
            }
            setApiAuthToken(idToken);
            setToken(idToken);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            });
          } catch (tokenErr) {
            console.warn("Error retrieving Firebase JWT token:", tokenErr);
            setUser(null);
            setToken(null);
            setApiAuthToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
          setApiAuthToken(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase auth listener error:", err);
      setUser(null);
      setToken(null);
      setApiAuthToken(null);
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const idToken = await res.user.getIdToken();
      setApiAuthToken(idToken);
      setToken(idToken);
    } catch (err: any) {
      console.warn("Firebase Google login error:", err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const idToken = await res.user.getIdToken();
      setApiAuthToken(idToken);
      setToken(idToken);
    } catch (err: any) {
      console.warn("Firebase email login error:", err);
      throw err;
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const idToken = await res.user.getIdToken();
      setApiAuthToken(idToken);
      setToken(idToken);
    } catch (err: any) {
      console.warn("Firebase signup error:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out error:", err);
    }
    setUser(null);
    setToken(null);
    setApiAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
