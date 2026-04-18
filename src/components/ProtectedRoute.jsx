import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getStudentLatestSubmission } from "@/utils/verificationDbUtils";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

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

  // NOTE: The onboarding completion flag is stored in the student_profiles table,
  // not in the Auth user object. Previously we attempted to redirect students
  // based on a non‑existent `user.onboarding_completed` property, which caused
  // users who had already submitted verification to be sent back to the onboarding
  // page on every login. The onboarding component now handles the redirect based
  // on the actual submission status, so we no longer perform this check here.

  // If the user has already completed verification or onboarding, redirect to home
  if (user.verification_status && user.verification_status !== "draft") {
    return <Navigate to="/" replace />;
  }
  if (user.onboarding_completed) {
    return <Navigate to="/" replace />;
  }

  // If we are on the onboarding page, check if the user already has a non‑draft submission
  useEffect(() => {
    const checkOnboardingSubmission = async () => {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }
      if (!location.pathname.includes("/student/onboarding")) {
        setCheckingOnboarding(false);
        return;
      }
      try {
        const { data: submission, error } = await getStudentLatestSubmission(user.id);
        if (submission && submission.submission_status && submission.submission_status !== "draft") {
          // Already submitted, redirect to home
          navigate("/", { replace: true });
        }
      } catch (e) {
        console.error("Error checking onboarding submission", e);
      } finally {
        setCheckingOnboarding(false);
      }
    };
    checkOnboardingSubmission();
  }, [user, location.pathname, navigate]);

  // While we are checking onboarding status, show a loading spinner
  if (checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
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
