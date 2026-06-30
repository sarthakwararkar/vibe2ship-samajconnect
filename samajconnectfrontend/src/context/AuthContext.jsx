import React, { createContext, useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import api from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const currentUser = user || auth.currentUser;
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const res = await api.get("/auth/me");
      setProfile(res.data.user || res.data);
    } catch (err) {
      console.warn("Failed to fetch user profile from backend", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const res = await api.get("/auth/me");
          setProfile(res.data.user || res.data);
        } catch (err) {
          console.warn("Firebase user exists, but failed to fetch backend profile.", err);
          setProfile(null);
        }
        setLoading(false);
      } else {
        // Dev Auto-Login: ONLY in development, if no active Firebase session and they didn't explicitly log out,
        // log in automatically as Sarthak (user_sarthak_001)
        const isLoggedOut = sessionStorage.getItem("loggedOut") === "true";
        if (import.meta.env.DEV && !isLoggedOut) {
          const mockUser = {
            uid: "user_sarthak_001",
            email: "sarthak@example.com",
            displayName: "Sarthak Kulkarni",
            isMock: true,
            getIdToken: async () => "mock-jwt-token-sarthak"
          };
          setUser(mockUser);
          api.defaults.headers.common["Authorization"] = "Bearer mock-jwt-token-sarthak";
          try {
            const res = await api.get("/auth/me");
            setProfile(res.data.user || res.data);
          } catch (err) {
            console.warn("Auto-login: failed to fetch profile from backend", err);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    sessionStorage.removeItem("loggedOut");
    
    // Check if it matches one of the seeded local mock users
    if (email === "sarthak@example.com" || email === "priya@example.com" || email === "ramesh@example.com") {
      const prefix = email.split("@")[0]; // "sarthak", "priya", or "ramesh"
      const uidMap = {
        sarthak: "user_sarthak_001",
        priya: "user_priya_002",
        ramesh: "user_ramesh_003"
      };
      const nameMap = {
        sarthak: "Sarthak Kulkarni",
        priya: "Priya Deshmukh",
        ramesh: "Ramesh Patil"
      };
      
      const mockUser = {
        uid: uidMap[prefix],
        email: email,
        displayName: nameMap[prefix],
        isMock: true,
        getIdToken: async () => `mock-jwt-token-${prefix}`
      };
      
      setUser(mockUser);
      api.defaults.headers.common["Authorization"] = `Bearer mock-jwt-token-${prefix}`;
      try {
        const res = await api.get("/auth/me");
        setProfile(res.data.user || res.data);
      } catch (err) {
        console.warn("Mock login profile fetch failed:", err);
      }
      return mockUser;
    }
    
    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerFirebase = (email, password) => {
    sessionStorage.removeItem("loggedOut");
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    sessionStorage.setItem("loggedOut", "true");
    setUser(null);
    setProfile(null);
    delete api.defaults.headers.common["Authorization"];
    return signOut(auth);
  };

  const loginWithGoogle = async () => {
    sessionStorage.removeItem("loggedOut");
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const value = {
    user,
    profile,
    loading,
    login,
    registerFirebase,
    logout,
    loginWithGoogle,
    refreshProfile,
    setProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

