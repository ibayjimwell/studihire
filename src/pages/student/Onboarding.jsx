// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileUp,
  X,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  createStudentSubmission,
  updateStudentSubmission,
  getStudentLatestSubmission,
  updateStudentProfile,
} from "@/utils/verificationDbUtils";
import { authUpdateProfile } from "@/utils/authUtils";
import {
  uploadResume,
  uploadStudentID,
  validateFileUpload,
} from "@/utils/fileUploadUtils";
import {
  parseResume,
  mapParsedResumeToFormData,
  extractResumeText,
} from "@/utils/resumeParsingUtils";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STEPS = [
  { id: 0, name: "Upload Resume",      description: "Upload your resume for AI analysis" },
  { id: 1, name: "Basic Info",         description: "Verify and update your basic information" },
  { id: 2, name: "Education",          description: "Add your education details" },
  { id: 3, name: "Skills & Experience",description: "Provide your skills and experience" },
  { id: 4, name: "Upload Student ID",  description: "Upload your student ID for verification" },
  { id: 5, name: "Review & Submit",    description: "Review and submit for admin verification" },
];

/** Default form state — all strings are empty, never null */
const DEFAULT_FORM = {
  full_name:           "",
  email:               "",
  phone_number:        "",
  location:            "",
  bio:                 "",
  education_level:     "Bachelor",
  institution:         "",
  graduation_year:     new Date().getFullYear(),
  field_of_study:      "",
  skills: {
    "What you can do": [],
  },
  experience:          [],
  years_of_experience: 0,
  resume_url:          "",
  student_id_url:      "",
};

/**
 * Converts null / undefined values from a DB row into safe defaults so that
 * React controlled inputs never receive null.
 * String fields → ""
 * Number fields → their default
 * Array  fields → []
 */
const sanitizeSubmission = (submission) => ({
  full_name:           submission.full_name           ?? "",
  email:               submission.email               ?? "",
  phone_number:        submission.phone_number        ?? "",
  location:            submission.location            ?? "",
  bio:                 submission.bio                 ?? "",
  education_level:     submission.education_level     ?? "Bachelor",
  institution:         submission.institution         ?? "",
  graduation_year:     submission.graduation_year     ?? new Date().getFullYear(),
  field_of_study:      submission.field_of_study      ?? "",
  years_of_experience: submission.years_of_experience ?? 0,
  resume_url:          submission.resume_url          ?? "",
  student_id_url:      submission.student_id_url      ?? "",
});

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function StudentOnboarding() {
  const navigate               = useNavigate();
  const { user, updateUserMetadata } = useAuth();

  // Immediate redirect guard
  if (
    user &&
    (user.onboarding_completed ||
      (user.verification_status && user.verification_status !== "draft"))
  ) {
    return <Navigate to="/" replace />;
  }

  const [currentStep,       setCurrentStep]       = useState(0);
  const [loading,           setLoading]           = useState(true);
  const [submitting,        setSubmitting]        = useState(false);
  const [error,             setError]             = useState("");
  const [submissionId,      setSubmissionId]      = useState(null);
  const [resumeFile,        setResumeFile]        = useState(null);
  const [studentIDFile,     setStudentIDFile]     = useState(null);
  const [resumeUploading,   setResumeUploading]   = useState(false);
  const [studentIDUploading,setStudentIDUploading]= useState(false);
  const [aiParsing,         setAIParsing]         = useState(false);
  const [skillInput,        setSkillInput]        = useState("");
  const [experienceInput,   setExperienceInput]   = useState("");

  const [formData, setFormData] = useState({
    ...DEFAULT_FORM,
    email: user?.email ?? "",
  });

  // ── useEffect redirect (fallback) ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (user.onboarding_completed) { navigate("/"); return; }
    if (user.verification_status && user.verification_status !== "draft") navigate("/");
  }, [user, navigate]);

  // ── Initialize — load existing draft ──────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        const { data: submission, error: fetchError } =
          await getStudentLatestSubmission(user.id);

        if (fetchError?.code === "PGRST116") {
          // Table missing — allow in-memory session
          setLoading(false);
          return;
        }
        if (fetchError) {
          console.error("Error fetching submission:", fetchError);
          setLoading(false);
          return;
        }

        // Non-draft → already submitted, redirect away
        if (submission?.submission_status && submission.submission_status !== "draft") {
          navigate("/");
          return;
        }

        if (submission?.submission_status === "draft") {
          setSubmissionId(submission.id);

          // Skills: DB stores a flat array; form uses { "What you can do": [] }
          let skills = { "What you can do": [] };
          if (Array.isArray(submission.skills) && submission.skills.length) {
            skills["What you can do"] = submission.skills;
          }

          // Experience: DB stores text; form uses array of { description }
          let experience = [];
          if (typeof submission.experience === "string" && submission.experience.trim()) {
            experience = submission.experience.split("\n\n").map((d) => ({
              description: d.trim(),
              start_date:  null,
              end_date:    null,
            }));
          } else if (Array.isArray(submission.experience)) {
            experience = submission.experience;
          }

          // ← KEY FIX: sanitize before merge so no null reaches an input
          setFormData((prev) => ({
            ...prev,
            ...sanitizeSubmission(submission),
            skills,
            experience,
          }));

          if (submission.student_id_url) setCurrentStep(5);
          else if (submission.resume_url)  setCurrentStep(2);
        } else {
          // Create a fresh draft
          const { data: newSub, error: createError } =
            await createStudentSubmission(user.id, {
              email:     user.email,
              full_name: user.full_name ?? "",
            });

          if (createError && createError.code !== "PGRST116") {
            console.error("Error creating submission:", createError);
          } else if (newSub) {
            setSubmissionId(newSub.id);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const set = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const addSkill = (category) => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...(prev.skills[category] ?? []), trimmed],
      },
    }));
    setSkillInput("");
  };

  const removeSkill = (category, index) =>
    setFormData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter((_, i) => i !== index),
      },
    }));

  const addExperience = () => {
    const trimmed = experienceInput.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience ?? []),
        { description: trimmed, start_date: null, end_date: null },
      ],
    }));
    setExperienceInput("");
  };

  const removeExperience = (index) =>
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));

  // ── Resume upload + AI parse ───────────────────────────────────────────
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const { valid, error: valErr } = validateFileUpload(file, "resume");
    if (!valid) { setError(valErr); return; }
    if (!user?.id) { setError("Not authenticated. Please log in again."); return; }

    setResumeUploading(true);
    try {
      const { url: uploadedUrl, error: uploadError } = await uploadResume(file, user.id);
      if (uploadError) {
        const msg = uploadError.message ?? "Failed to upload resume";
        if (msg.includes("Bucket not found") || msg.includes("404") || msg.includes("400")) {
          setError(
            "⚠️ Storage not configured.\n\n" +
            "1. Go to Supabase Dashboard → Storage\n" +
            "2. Create two PUBLIC buckets: student-resumes and student-ids\n" +
            "3. Add RLS policies to allow authenticated uploads\n\n" +
            "Then try again."
          );
        } else {
          setError(msg);
        }
        return;
      }

      setAIParsing(true);
      let resumeText = "";
      try {
        resumeText = await extractResumeText(file);
      } catch (extractErr) {
        setError("Failed to read resume. Please try again or fill in manually.");
        set("resume_url", uploadedUrl);
        return;
      }

      const { parsed_data, confidence, error: parseError } = await parseResume(resumeText);
      if (parseError) {
        const msg =
          parseError.code === "insufficient_balance"
            ? parseError.message + " You can fill in the form manually."
            : "AI parsing failed. Resume uploaded — please fill in the form manually.";
        setError(msg);
        set("resume_url", uploadedUrl);
        return;
      }

      const mapped = mapParsedResumeToFormData(parsed_data);
      setFormData((prev) => ({
        ...prev,
        resume_url:          uploadedUrl,
        full_name:           mapped.full_name           || prev.full_name,
        email:               user.email,
        phone_number:        mapped.phone_number        || prev.phone_number,
        location:            mapped.location            || prev.location,
        bio:                 mapped.bio                 || prev.bio,
        education_level:     mapped.education_level     || prev.education_level,
        years_of_experience: mapped.years_of_experience || prev.years_of_experience,
        skills: {
          "What you can do": [
            ...(mapped.skills?.technical  ?? []),
            ...(mapped.skills?.soft       ?? []),
            ...(mapped.skills?.languages  ?? []),
            ...(mapped.skills?.tools      ?? []),
          ],
        },
        experience: mapped.experience || prev.experience,
      }));

      if (submissionId) {
        const { error: dbErr } = await updateStudentSubmission(submissionId, {
          resume_url:               uploadedUrl,
          ai_parsed_resume:         parsed_data,
          ai_extraction_confidence: confidence,
        });
        if (dbErr && dbErr.code !== "PGRST116") console.error("DB update error:", dbErr);
      }

      setCurrentStep(1);
    } catch (err) {
      setError(err.message || "An error occurred while processing your resume.");
    } finally {
      setResumeUploading(false);
      setAIParsing(false);
    }
  };

  // ── Student ID upload ──────────────────────────────────────────────────
  const handleStudentIDUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const { valid, error: valErr } = validateFileUpload(file, "student_id");
    if (!valid) { setError(valErr); return; }
    if (!user?.id) { setError("Not authenticated. Please log in again."); return; }

    setStudentIDUploading(true);
    try {
      const { url: uploadedUrl, error: uploadError } = await uploadStudentID(file, user.id);
      if (uploadError) { setError(uploadError.message || "Failed to upload student ID."); return; }

      setStudentIDFile(file);
      set("student_id_url", uploadedUrl);
      setCurrentStep(5);
    } catch (err) {
      setError(err.message || "An error occurred while uploading your student ID.");
    } finally {
      setStudentIDUploading(false);
    }
  };

  // ── Final submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!submissionId || !formData.student_id_url) {
      setError("Please complete all required fields and upload your student ID.");
      return;
    }
    if (!user?.id) { setError("Not authenticated. Please log in again."); return; }

    setSubmitting(true);
    setError("");

    try {
      // Flatten skills object → array
      const flatSkills = Object.values(formData.skills).flat().filter(Boolean);

      // Flatten experience array → joined text
      const expText =
        Array.isArray(formData.experience) && formData.experience.length
          ? formData.experience.map((e) => e.description).join("\n\n")
          : "";

      const { error: updateError } = await updateStudentSubmission(submissionId, {
        full_name:           formData.full_name,
        email:               formData.email,
        phone_number:        formData.phone_number   || null,
        location:            formData.location       || null,
        bio:                 formData.bio            || null,
        education_level:     formData.education_level,
        institution:         formData.institution,
        graduation_year:     formData.graduation_year,
        field_of_study:      formData.field_of_study || null,
        skills:              flatSkills,
        experience:          expText                 || null,
        years_of_experience: formData.years_of_experience,
        student_id_url:      formData.student_id_url,
        resume_url:          formData.resume_url     || null,
        submission_status:   "submitted",
        submitted_at:        new Date().toISOString(),
      });

      if (updateError && updateError.code !== "PGRST116") {
        setError("Failed to save your information: " + (updateError.message ?? "Unknown error"));
        return;
      }

      // Sync to student_profiles (best-effort)
      try {
        await updateStudentProfile(user.id, {
          full_name:           formData.full_name,
          email:               formData.email,
          phone_number:        formData.phone_number || null,
          location:            formData.location     || null,
          bio:                 formData.bio          || null,
          verification_status: "submitted",
          onboarding_completed: true,
        });
      } catch (profileErr) {
        console.warn("Profile update failed:", profileErr);
      }

      // Persist to auth metadata
      try {
        await authUpdateProfile({ verification_status: "submitted", onboarding_completed: true });
      } catch (e) {
        console.warn("Auth metadata update failed:", e);
      }

      if (updateUserMetadata) {
        updateUserMetadata({ onboarding_completed: true, verification_status: "submitted" });
      }

      navigate("/", { state: { submissionSuccess: true } });
    } catch (err) {
      setError(err.message || "An error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading screen ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your onboarding…</p>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1">Submit your resume and ID for verification.</p>
        </div>

        {/* Progress */}
        <Card className="mb-8 border-border">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">{STEPS[currentStep].name}</span>
            </div>
            <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Error banner */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* Step content */}
        <Card className="border-border">
          <CardContent className="pt-6">
            {currentStep === 0 && (
              <ResumeUploadStep
                resumeUploading={resumeUploading}
                aiParsing={aiParsing}
                handleResumeUpload={handleResumeUpload}
                onNext={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 1 && (
              <BasicInfoStep
                formData={formData}
                updateField={set}
                onNext={() => setCurrentStep(2)}
                onPrev={() => setCurrentStep(0)}
              />
            )}
            {currentStep === 2 && (
              <EducationStep
                formData={formData}
                updateField={set}
                onNext={() => setCurrentStep(3)}
                onPrev={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 3 && (
              <SkillsExperienceStep
                formData={formData}
                updateField={set}
                skillInput={skillInput}
                setSkillInput={setSkillInput}
                experienceInput={experienceInput}
                setExperienceInput={setExperienceInput}
                addSkill={addSkill}
                removeSkill={removeSkill}
                addExperience={addExperience}
                removeExperience={removeExperience}
                onNext={() => setCurrentStep(4)}
                onPrev={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 4 && (
              <StudentIDUploadStep
                studentIDFile={studentIDFile}
                studentIDUploading={studentIDUploading}
                handleStudentIDUpload={handleStudentIDUpload}
                onNext={() => setCurrentStep(5)}
                onPrev={() => setCurrentStep(3)}
              />
            )}
            {currentStep === 5 && (
              <ReviewStep
                formData={formData}
                submitting={submitting}
                handleSubmit={handleSubmit}
                onPrev={() => setCurrentStep(4)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Step sub-components
// ─────────────────────────────────────────────

function ResumeUploadStep({ resumeUploading, aiParsing, handleResumeUpload, onNext }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Upload Your Resume</h3>
        <p className="text-sm text-muted-foreground">
          Upload your resume in PDF format. Our AI will pre-fill your information.
        </p>
      </div>

      <label
        htmlFor="resume-upload"
        className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
      >
        {resumeUploading || aiParsing ? (
          <>
            <Loader2 className="w-9 h-9 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-foreground">
              {aiParsing ? "Analyzing your resume…" : "Uploading resume…"}
            </p>
          </>
        ) : (
          <>
            <FileUp className="w-9 h-9 text-primary mb-3" />
            <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">PDF (max 10 MB)</p>
          </>
        )}
        <input
          id="resume-upload"
          type="file"
          accept=".pdf"
          className="hidden"
          disabled={resumeUploading || aiParsing}
          onChange={handleResumeUpload}
        />
      </label>

      <div className="flex justify-end">
        <Button variant="outline" disabled={resumeUploading || aiParsing} onClick={onNext}>
          Skip & Fill Manually
        </Button>
      </div>
    </div>
  );
}

function BasicInfoStep({ formData, updateField, onNext, onPrev }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            className="mt-1"
            value={formData.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
            placeholder="Your full name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            className="mt-1"
            value={formData.email}
            disabled
            placeholder="Your email (from signup)"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            className="mt-1"
            value={formData.phone_number}
            onChange={(e) => updateField("phone_number", e.target.value)}
            placeholder="+63 912 345 6789"
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            className="mt-1"
            value={formData.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="City, Country"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio / Professional Summary</Label>
        <Textarea
          id="bio"
          className="mt-1"
          rows={4}
          value={formData.bio}
          onChange={(e) => updateField("bio", e.target.value)}
          placeholder="Tell us about yourself…"
        />
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrev}>Back</Button>
        <Button
          className="gradient-primary text-white border-0"
          onClick={onNext}
          disabled={!formData.full_name.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function EducationStep({ formData, updateField, onNext, onPrev }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Education Details</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Education Level</Label>
          <Select
            value={formData.education_level}
            onValueChange={(v) => updateField("education_level", v)}
          >
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Diploma">Diploma</SelectItem>
              <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
              <SelectItem value="Master">Master's Degree</SelectItem>
              <SelectItem value="PhD">PhD</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="institution">Institution / University *</Label>
          <Input
            id="institution"
            className="mt-1"
            value={formData.institution}
            onChange={(e) => updateField("institution", e.target.value)}
            placeholder="Your school/university"
          />
        </div>
        <div>
          <Label htmlFor="fieldOfStudy">Field of Study</Label>
          <Input
            id="fieldOfStudy"
            className="mt-1"
            value={formData.field_of_study}
            onChange={(e) => updateField("field_of_study", e.target.value)}
            placeholder="e.g. Computer Science"
          />
        </div>
        <div>
          <Label htmlFor="gradYear">Expected Graduation Year</Label>
          <Input
            id="gradYear"
            type="number"
            className="mt-1"
            value={formData.graduation_year}
            onChange={(e) => updateField("graduation_year", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrev}>Back</Button>
        <Button
          className="gradient-primary text-white border-0"
          onClick={onNext}
          disabled={!formData.institution.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function SkillsExperienceStep({
  formData, updateField,
  skillInput, setSkillInput,
  experienceInput, setExperienceInput,
  addSkill, removeSkill,
  addExperience, removeExperience,
  onNext, onPrev,
}) {
  const CATEGORY = "What you can do";

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Skills & Experience</h3>

      {/* Skills */}
      <div>
        <Label className="block mb-1">{CATEGORY}</Label>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="e.g. JavaScript, Photoshop, Communication…"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(CATEGORY); } }}
          />
          <Button type="button" variant="outline" size="icon" onClick={() => addSkill(CATEGORY)} disabled={!skillInput.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {(formData.skills[CATEGORY] ?? []).map((skill, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
              {skill}
              <button onClick={() => removeSkill(CATEGORY, i)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Years of experience */}
      <div>
        <Label htmlFor="yearsExp">Years of Experience</Label>
        <Input
          id="yearsExp"
          type="number"
          min="0"
          step="0.5"
          className="mt-1"
          value={formData.years_of_experience}
          onChange={(e) => updateField("years_of_experience", parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Work experience */}
      <div>
        <h4 className="font-medium text-foreground mb-2">Work Experience</h4>
        <div className="flex gap-2 mb-3">
          <Textarea
            rows={2}
            value={experienceInput}
            onChange={(e) => setExperienceInput(e.target.value)}
            placeholder="Describe a work experience…"
          />
          <Button type="button" variant="outline" size="icon" onClick={addExperience} disabled={!experienceInput.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {(formData.experience ?? []).map((exp, i) => (
            <div key={i} className="flex justify-between items-start gap-3 p-3 bg-muted/40 rounded-lg">
              <p className="text-sm flex-1">{exp.description}</p>
              <Button variant="ghost" size="icon" onClick={() => removeExperience(i)}>
                <X className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrev}>Back</Button>
        <Button className="gradient-primary text-white border-0" onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

function StudentIDUploadStep({ studentIDFile, studentIDUploading, handleStudentIDUpload, onNext, onPrev }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Upload Student ID</h3>
        <p className="text-sm text-muted-foreground">Upload a clear photo or scan of your student ID.</p>
      </div>

      <label
        htmlFor="student-id-upload"
        className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
      >
        {studentIDUploading ? (
          <>
            <Loader2 className="w-9 h-9 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium">Uploading…</p>
          </>
        ) : (
          <>
            <Upload className="w-9 h-9 text-primary mb-3" />
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or PDF (max 10 MB)</p>
          </>
        )}
        <input
          id="student-id-upload"
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          disabled={studentIDUploading}
          onChange={handleStudentIDUpload}
        />
      </label>

      {studentIDFile && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">{studentIDFile.name} uploaded successfully</p>
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrev}>Back</Button>
        <Button
          className="gradient-primary text-white border-0"
          onClick={onNext}
          disabled={studentIDUploading || !studentIDFile}
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({ formData, submitting, handleSubmit, onPrev }) {
  const allSkills = Object.values(formData.skills ?? {}).flat().filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Review Your Information</h3>
        <p className="text-sm text-muted-foreground">Check everything before submitting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p><span className="text-muted-foreground">Name: </span>{formData.full_name}</p>
            <p><span className="text-muted-foreground">Email: </span>{formData.email}</p>
            <p><span className="text-muted-foreground">Phone: </span>{formData.phone_number || "Not provided"}</p>
            <p><span className="text-muted-foreground">Location: </span>{formData.location || "Not provided"}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Education</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p><span className="text-muted-foreground">Institution: </span>{formData.institution}</p>
            <p><span className="text-muted-foreground">Field: </span>{formData.field_of_study || "Not specified"}</p>
            <p><span className="text-muted-foreground">Grad. Year: </span>{formData.graduation_year}</p>
          </CardContent>
        </Card>
      </div>

      {allSkills.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {allSkills.map((s, i) => (
                <span key={i} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">{s}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" /> Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          {formData.resume_url && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" /><span>Resume uploaded</span>
            </div>
          )}
          {formData.student_id_url && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" /><span>Student ID uploaded</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>Next:</strong> Your information will be sent to our admins for verification. This usually takes 1–2 business days.
        </p>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrev} disabled={submitting}>Back</Button>
        <Button
          className="gradient-primary text-white border-0"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
          ) : (
            <><CheckCircle className="w-4 h-4 mr-2" /> Submit for Verification</>
          )}
        </Button>
      </div>
    </div>
  );
}