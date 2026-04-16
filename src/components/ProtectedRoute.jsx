import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still checking authentication state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // User is not authenticated
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check if student needs to complete onboarding
  if (
    user.role === "student" &&
    !user.onboarding_completed &&
    !location.pathname.includes("/student/onboarding")
  ) {
    return (
      <Navigate to="/student/onboarding" state={{ from: location }} replace />
    );
  }

  // Check if user has required role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to user's dashboard based on their role
    const roleRoutes = {
      admin: "/admin",
      client: "/client/dashboard",
      student: "/student/dashboard",
    };

    return (
      <Navigate
        to={roleRoutes[user.role] || "/"}
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}
