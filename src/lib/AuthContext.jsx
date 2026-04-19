// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from "react";
import { authOnAuthStateChange, authLogout } from "@/utils/authUtils";

// Create a context for authentication state
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth and listen for session changes
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authOnAuthStateChange((authUser) => {
      if (authUser) {
        // User is signed in
        setUser({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.full_name || "",
          role: authUser.role || "admin",
          avatar_url: authUser.user_metadata?.avatar_url || null,
          onboarding_completed:
            authUser.onboarding_completed || false,
          verification_status:
            authUser.verification_status || "draft",
          profile_verified: authUser.profile_verified || false,
        });
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      // Unsubscribe from auth state changes on cleanup
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const logout = async () => {
    try {
      await authLogout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateUserMetadata = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, setUser, logout, updateUserMetadata }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
