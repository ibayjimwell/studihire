import React, { createContext, useContext, useState, useEffect } from "react";
import {
  authOnAuthStateChange,
  authLogout,
  authGetSession,
} from "@/utils/authUtils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Get the current session immediately (prevents flicker)
    const initSession = async () => {
      try {
        const { session } = await authGetSession();
        if (isMounted && session?.user) {
          const authUser = session.user;
          setUser({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || "",
            role: authUser.user_metadata?.role || "student",
            avatar_url: authUser.user_metadata?.avatar_url || null,
            onboarding_completed: authUser.user_metadata?.onboarding_completed || false,
            verification_status: authUser.user_metadata?.verification_status || "draft",
            profile_verified: authUser.user_metadata?.profile_verified || false,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to get session:", error);
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initSession();

    // 2. Subscribe to future auth changes
    const unsubscribe = authOnAuthStateChange((authUser, event) => {
      if (!isMounted) return;
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || "",
          role: authUser.user_metadata?.role || "student",
          avatar_url: authUser.user_metadata?.avatar_url || null,
          onboarding_completed: authUser.user_metadata?.onboarding_completed || false,
          verification_status: authUser.user_metadata?.verification_status || "draft",
          profile_verified: authUser.user_metadata?.profile_verified || false,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await authLogout();
    setUser(null);
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