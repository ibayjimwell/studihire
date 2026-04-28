// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import {
  createClientSubmission,
  updateClientSubmission,
  getClientLatestSubmission,
  submitClientVerification,
  updateClientProfile,
  uploadClientValidID,
} from "@/utils/clientVerificationDbUtils";
import { authUpdateProfile } from "@/utils/authUtils";
import {
  Briefcase,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileUp,
} from "lucide-react";

const STEPS = [
  { id: 0, name: "Business Info", description: "Tell us about you or your company" },
  { id: 1, name: "Upload Valid ID", description: "Submit a government or business ID" },
  { id: 2, name: "Review & Submit", description: "Verify everything and send for review" },
];

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const { user, updateUserMetadata } = useAuth();

  // Guard: redirect if already completed onboarding or verification
  if (user && (user.onboarding_completed || (user.verification_status && user.verification_status !== "draft"))) {
    return <Navigate to="/" replace />;
  }

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [idUploading, setIdUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: user?.email || "",
    phone_number: "",
    location: "",
    company_name: "",
    company_type: "",
    industry: "",
    website: "",
    bio: "",
    valid_id_url: "",
  });

  // Init submit
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: submission } = await getClientLatestSubmission(user.id);
        if (submission && submission.submission_status !== "draft") {
          navigate("/");
          return;
        }
        if (submission) {
          setSubmissionId(submission.id);
          setFormData((prev) => ({ ...prev, ...submission }));
          if (submission.valid_id_url) setCurrentStep(2);
          else if (submission.company_name) setCurrentStep(1);
        } else {
          const { data: newSub } = await createClientSubmission(user.id, {
            email: user.email,
            full_name: user.full_name,
          });
          if (newSub) setSubmissionId(newSub.id);
        }
      } catch (err) {
        console.warn("Onboarding init error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const updateField = (key, value) => setFormData((p) => ({ ...p, [key]: value }));

  // Valid ID upload
  const handleIdUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setError("");
  setIdUploading(true);

  try {
    const { url, error: uploadErr } = await uploadClientValidID(file, user.id);
    if (uploadErr) throw uploadErr;

    // Persist to local state
    setIdFile(file);
    setFormData((p) => ({ ...p, valid_id_url: url }));

    // Also save the URL to the draft submission immediately
    if (submissionId) {
      const { error: dbErr } = await updateClientSubmission(submissionId, {
        valid_id_url: url,
      });
      if (dbErr) console.warn("Could not save ID URL to draft:", dbErr);
    }

    setCurrentStep(2);
  } catch (err) {
    setError(err.message || "Upload failed");
  } finally {
    setIdUploading(false);
  }
};

  // Final submit
  const handleSubmit = async () => {
  if (!submissionId) {
    setError("No submission found. Please refresh the page.");
    return;
  }

  // Check local state first
  let validIdUrl = formData.valid_id_url;

  // If local state is empty, try to recover from the saved draft
  if (!validIdUrl) {
    const { data: freshSubmission } = await getClientLatestSubmission(user.id);
    if (freshSubmission?.valid_id_url) {
      validIdUrl = freshSubmission.valid_id_url;
      // Update the form state so the UI shows it as present
      setFormData((prev) => ({ ...prev, valid_id_url: validIdUrl }));
    }
  }

  // Final check
  if (!validIdUrl) {
    setError("Please upload a valid ID.");
    return;
  }

  setSubmitting(true);
  setError("");

  try {
    // Save the final data and mark as submitted
    await updateClientSubmission(submissionId, {
      ...formData,
      valid_id_url: validIdUrl,
      submission_status: "submitted",
      submitted_at: new Date().toISOString(),
    });

    // Create or update the client profile
    await updateClientProfile(user.id, {
      full_name: formData.full_name,
      email: formData.email,
      phone_number: formData.phone_number,
      location: formData.location,
      company_name: formData.company_name,
      company_type: formData.company_type,
      industry: formData.industry,
      website: formData.website,
      bio: formData.bio,
      verification_status: "submitted",
      onboarding_completed: true,
    });

    // Sync verification status to auth metadata
    await authUpdateProfile({
      verification_status: "submitted",
      onboarding_completed: true,
    });

    // Update local context so ProtectedRoute knows onboarding is done
    updateUserMetadata({
      onboarding_completed: true,
      verification_status: "submitted",
    });

    navigate("/", { state: { submissionSuccess: true } });
  } catch (err) {
    setError(err.message || "Submission failed");
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Complete Your Client Profile</h1>
          </div>
          <p className="text-muted-foreground">Submit your info and ID for verification.</p>
        </div>

        {/* Progress */}
        <Card className="mb-8 border-border">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">
                  Step {currentStep + 1} of {STEPS.length}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {STEPS[currentStep].name}
                </span>
              </div>
              <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <Card className="border-border">
          <CardContent className="pt-6">
            {/* Step 0: Business Info */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Your Business / Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" value={formData.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" value={formData.email} disabled />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={formData.phone_number} onChange={(e) => updateField("phone_number", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={formData.location} onChange={(e) => updateField("location", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="company">Company / Organization Name</Label>
                    <Input id="company" value={formData.company_name} onChange={(e) => updateField("company_name", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="type">Company Type</Label>
                    <Select value={formData.company_type} onValueChange={(v) => updateField("company_type", v)}>
                      <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {["individual","startup","sme","enterprise","ngo","other"].map(t => (
                          <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" value={formData.industry} onChange={(e) => updateField("industry", e.target.value)} />
                  </div>
                  <div className="col-span-full">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={formData.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">About / Description</Label>
                  <Textarea id="bio" value={formData.bio} onChange={(e) => updateField("bio", e.target.value)} rows={4} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setCurrentStep(1)} disabled={!formData.full_name} className="gradient-primary text-white border-0">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 1: Upload Valid ID */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Upload Valid ID</h3>
                  <p className="text-sm text-muted-foreground">Government ID, business permit, or similar document.</p>
                </div>
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/60 transition">
                  <input type="file" onChange={handleIdUpload} disabled={idUploading} accept="image/*,.pdf" className="hidden" id="id-upload" />
                  <label htmlFor="id-upload" className="cursor-pointer block">
                    {idUploading ? (
                      <div className="space-y-2"><Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" /><p>Uploading…</p></div>
                    ) : (
                      <div className="space-y-2"><Upload className="w-8 h-8 text-primary mx-auto" /><p>Click to upload</p><p className="text-xs text-muted-foreground">JPG, PNG, PDF (max 5MB)</p></div>
                    )}
                  </label>
                </div>
                {idFile && !idUploading && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">{idFile.name} uploaded</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(0)}>Back</Button>
                  <Button onClick={() => setCurrentStep(2)} disabled={!formData.valid_id_url} className="gradient-primary text-white border-0">
                    Continue to Review
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Review & Submit */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Review Your Information</h3>
                  <p className="text-sm text-muted-foreground">Make sure everything is correct before submitting.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-border/50"><CardContent className="p-4 text-sm space-y-1">
                    <p><span className="text-muted-foreground">Full Name:</span> {formData.full_name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {formData.phone_number || "—"}</p>
                    <p><span className="text-muted-foreground">Location:</span> {formData.location || "—"}</p>
                  </CardContent></Card>
                  <Card className="border-border/50"><CardContent className="p-4 text-sm space-y-1">
                    <p><span className="text-muted-foreground">Company:</span> {formData.company_name || "—"}</p>
                    <p><span className="text-muted-foreground">Type:</span> {formData.company_type || "—"}</p>
                    <p><span className="text-muted-foreground">Industry:</span> {formData.industry || "—"}</p>
                    <p><span className="text-muted-foreground">Website:</span> {formData.website || "—"}</p>
                  </CardContent></Card>
                </div>
                {formData.valid_id_url && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-800">Valid ID uploaded</span>
                  </div>
                )}
               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Next:</strong> Your information will be sent to our admins for verification. 
                  </p>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} disabled={submitting}>Back</Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="gradient-primary text-white border-0">
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : <><CheckCircle className="w-4 h-4 mr-2" /> Submit for Verification</>}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}