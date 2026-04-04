import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/mockBase44Client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if userRole is specified in URL params or localStorage
        const params = new URLSearchParams(window.location.search);
        const userRole =
          params.get("userRole") ||
          localStorage.getItem("mockUserRole") ||
          "student";
        localStorage.setItem("mockUserRole", userRole);

        // Get the appropriate user based on role
        let currentUser;
        if (userRole === "admin") {
          currentUser = {
            id: "user-3",
            email: "admin@example.com",
            full_name: "Admin User",
            role: "admin",
          };
        } else if (userRole === "client") {
          currentUser = {
            id: "user-2",
            email: "jane.smith@example.com",
            full_name: "Jane Smith",
            role: "client",
          };
        } else {
          currentUser = {
            id: "user-1",
            email: "john.doe@example.com",
            full_name: "John Doe",
            role: "student",
          };
        }
        setUser(currentUser);
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const switchUser = (role) => {
    localStorage.setItem("mockUserRole", role);
    window.location.href = `${window.location.pathname}?userRole=${role}`;
  };

  return (
    <AuthContext.Provider value={{ user, loading, switchUser }}>
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
