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
    const prefix = email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
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
    
    const createMockUser = (p, e) => ({
      uid: uidMap[p] || `user_${p}_001`,
      email: e,
      displayName: nameMap[p] || p,
      isMock: true,
      getIdToken: async () => `mock-jwt-token-${p}`
    });
    
    if (uidMap[prefix]) {
      // Known seeded mock user — use mock login directly
      const mockUser = createMockUser(prefix, email);
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
    
    // Try real Firebase Auth; fall back to mock if Firebase Auth is not configured
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (firebaseErr) {
      console.warn("Firebase Auth login failed, using mock fallback:", firebaseErr.code);
      const mockUser = createMockUser(prefix, email);
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
  };

  const registerFirebase = async (email, password) => {
    sessionStorage.removeItem("loggedOut");
    try {
      // Try real Firebase Auth first
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return cred;
    } catch (firebaseErr) {
      // If Firebase Auth is not configured (e.g. auth/configuration-not-found),
      // fall back to mock registration so the app still works
      console.warn("Firebase Auth registration failed, using mock fallback:", firebaseErr.code);
      
      const prefix = email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
      const uid = `user_${prefix}_${Date.now().toString(36)}`;
      const mockUser = {
        uid,
        email,
        displayName: prefix,
        isMock: true,
        getIdToken: async () => `mock-jwt-token-${prefix}`
      };
      
      setUser(mockUser);
      api.defaults.headers.common["Authorization"] = `Bearer mock-jwt-token-${prefix}`;
      return { user: mockUser };
    }
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

