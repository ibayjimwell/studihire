// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Mail,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { authSendVerificationEmail } from "@/utils/authUtils";

export default function EmailVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Check if user is verified on component mount
  useEffect(() => {
    if (user && user.isVerified) {
      // User is already verified, redirect to onboarding
      navigate("/student/onboarding");
    }
  }, [user, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendVerification = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      // Send verification email using Supabase auth
      const { error } = await supabase.auth.resendEmailConfirmation(user.email);

      if (error) {
        setError(error.message || "Failed to send verification email");
        setLoading(false);
        return;
      }

      setEmailSent(true);
      setCooldown(60); // 60 second cooldown
      setLoading(false);
    } catch (err) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    // Refresh the auth session to check verification status
    const { data } = await supabase.auth.refreshSession();
    if (data.user && data.user.email_confirmed_at) {
      // Email is now verified
      navigate("/student/onboarding");
    } else {
      setError("Email not yet verified. Check your inbox and spam folder.");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">
            Studi<span className="text-primary">Hire</span>
          </span>
        </div>

        {/* Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-3">
              <Mail className="w-12 h-12 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">
              Email Verification Required
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Students need to verify their email first before proceeding with
              onboarding
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Step indicator */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-blue-900">
                    Check your email
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    We sent a verification link to <strong>{user.email}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Email sent confirmation */}
            {emailSent && (
              <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-600">
                  Verification email sent! Check your inbox.
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="font-medium text-sm text-foreground">Steps:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Check your email inbox for the verification link</li>
                <li>If you don't see it, check your spam/junk folder</li>
                <li>Click the link in the email to verify your account</li>
                <li>Return here and click "Verified" to continue</li>
              </ol>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleRefreshStatus}
                disabled={loading}
                className="gradient-primary text-white border-0 w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    I've Verified My Email
                  </>
                )}
              </Button>

              <Button
                onClick={handleSendVerification}
                disabled={loading || cooldown > 0}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend in {cooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>

            {/* Help text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Make sure to check your spam folder if you
                don't see the email in your inbox. Also mark our email as "Not
                Spam" to ensure future emails reach you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Import supabase at the top of file
import supabase from "@/lib/supabaseClient";
