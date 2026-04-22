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
  Sparkles,
  FileUp,
  X,
  Plus,
  Info,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  createStudentSubmission,
  updateStudentSubmission,
  getStudentLatestSubmission,
  submitStudentVerification,
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

const STEPS = [
  {
    id: 0,
    name: "Upload Resume",
    description: "Upload your resume for AI analysis",
  },
  {
    id: 1,
    name: "Basic Info",
    description: "Verify and update your basic information",
  },
  { id: 2, name: "Education", description: "Add your education details" },
  {
    id: 3,
    name: "Skills & Experience",
    description: "Provide your skills and experience",
  },
  {
    id: 4,
    name: "Upload Student ID",
    description: "Upload your student ID for verification",
  },
  {
    id: 5,
    name: "Review & Submit",
    description: "Review and submit for admin verification",
  },
];

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const { user, updateUserMetadata } = useAuth();

  // Immediate guard: if the user has already completed onboarding or verification,
  // prevent rendering the onboarding page and redirect to home.
  if (user && (user.onboarding_completed || (user.verification_status && user.verification_status !== "draft"))) {
    return <Navigate to="/" replace />;
  }

  // Navigation
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect if user has already completed onboarding or submitted verification
  useEffect(() => {
    if (!user) return;
    // If the onboarding_completed flag is set (we set it after successful submission),
    // redirect the user away from the onboarding page.
    if (user.onboarding_completed) {
      navigate("/");
      return;
    }
    // Fallback: if verification_status exists and is not "draft", also redirect.
    if (user.verification_status && user.verification_status !== "draft") {
      navigate("/");
    }
  }, [user, navigate]);

  // Submission state
  const [submissionId, setSubmissionId] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [studentIDFile, setStudentIDFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [studentIDUploading, setStudentIDUploading] = useState(false);
  const [aiParsing, setAIParsing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: user?.email || "",
    phone_number: "",
    location: "",
    bio: "",
    education_level: "Bachelor",
    institution: "",
    graduation_year: new Date().getFullYear(),
    field_of_study: "",
    skills: {
      technical: [],
      soft: [],
      languages: [],
      tools: [],
    },
    experience: [],
    years_of_experience: 0,
    resume_url: "",
    student_id_url: "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [experienceInput, setExperienceInput] = useState("");

  // Initialize - load existing submission if any
  useEffect(() => {
    const initializeOnboarding = async () => {
      if (!user) return;

      try {
        const { data: submission, error: fetchError } =
          await getStudentLatestSubmission(user.id);

        if (fetchError && fetchError.code === "PGRST116") {
          // Table doesn't exist yet - database migration not run
          // Create a temporary submission in memory for current session
          console.warn(
            "Database not initialized yet. Using session storage only.",
          );
          setLoading(false);
          return;
        }

        if (fetchError) {
          console.error("Error fetching submission:", fetchError);
          // Continue with default form - allow user to work offline
          setLoading(false);
          return;
        }

        // If a submission exists and is not in draft status, the user has already submitted
        // their verification. Redirect them away from the onboarding page.
        if (submission && submission.submission_status && submission.submission_status !== "draft") {
          // Redirect to home (or dashboard) since onboarding is only for new users
          navigate("/");
          return;
        }

        if (submission && submission.submission_status === "draft") {
          // Load existing draft
          setSubmissionId(submission.id);
          
          // Transform skills from database format (array) to form format (object with categories)
          let transformedSkills = {
            technical: [],
            soft: [],
            languages: [],
            tools: [],
          };
          if (submission.skills && Array.isArray(submission.skills)) {
            // Database stores skills as a flat array, convert to categorized object
            transformedSkills.technical = submission.skills;
          } else if (submission.skills && typeof submission.skills === 'object' && !Array.isArray(submission.skills)) {
            transformedSkills = submission.skills;
          }
          
          // Transform experience from database format (text) to form format (array)
          let transformedExperience = [];
          if (submission.experience && typeof submission.experience === 'string' && submission.experience.trim()) {
            transformedExperience = submission.experience.split('\n\n').map(desc => ({
              description: desc.trim(),
              start_date: null,
              end_date: null,
            }));
          } else if (Array.isArray(submission.experience)) {
            transformedExperience = submission.experience;
          }
          
          setFormData((prev) => ({
            ...prev,
            ...submission,
            skills: transformedSkills,
            experience: transformedExperience,
          }));

          // Determine which step to go to
          if (submission.student_id_url) {
            setCurrentStep(5); // Review step
          } else if (submission.resume_url) {
            setCurrentStep(2);
          }
        } else {
          // Create new submission
          const { data: newSubmission, error: createError } =
            await createStudentSubmission(user.id, {
              email: user.email,
              full_name: user.full_name,
            });

          if (createError && createError.code === "PGRST116") {
            // Table doesn't exist - database migration not run
            console.warn(
              "Database not initialized yet. Using session storage only.",
            );
          } else if (createError) {
            console.error("Error creating submission:", createError);
          } else if (newSubmission) {
            setSubmissionId(newSubmission.id);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initializeOnboarding();
  }, [user]);

  // Handle resume upload and AI parsing
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const { valid, error: validationError } = validateFileUpload(
      file,
      "resume",
    );

    if (!valid) {
      setError(validationError);
      return;
    }

    if (!user || !user.id) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    setResumeUploading(true);

    try {
      // 1. Upload resume to Supabase Storage
      const { url: uploadedUrl, error: uploadError } = await uploadResume(
        file,
        user.id,
      );

      if (uploadError) {
        const errorMsg = uploadError.message || "Failed to upload resume";
        console.error("Resume upload error:", uploadError);

        // Storage setup needed
        if (
          errorMsg.includes("Bucket not found") ||
          errorMsg.includes("404") ||
          errorMsg.includes("400")
        ) {
          setError(
            `⚠️ Storage not configured. Setup needed:\n\n` +
              `1. Go to Supabase Dashboard → Storage\n` +
              `2. Create two PUBLIC buckets: "student-resumes" and "student-ids"\n` +
              `3. Add RLS policies to allow authenticated uploads\n` +
              `4. Run the database migration (see docs)\n\n` +
              `After setup, try uploading again.`,
          );
        } else {
          setError(errorMsg);
        }

        setResumeUploading(false);
        return;
      }

      // 2. Extract text from resume
      setAIParsing(true);
      let resumeText;
      let extractError;
      
      try {
        resumeText = await extractResumeText(file);
      } catch (error) {
        extractError = error;
      }

      if (extractError || !resumeText) {
        setError(
          "Failed to extract resume text. Please try again or upload manually.",
        );
        setAIParsing(false);
        setResumeUploading(false);
        return;
      }

      // 3. Parse with LLM
      const {
        parsed_data,
        confidence,
        error: parseError,
      } = await parseResume(resumeText);

      if (parseError) {
        // Show specific error message for insufficient balance
        let errorMessage = "AI parsing failed. Your resume has been uploaded. You can fill in the form manually.";
        if (parseError.code === "insufficient_balance") {
          errorMessage = parseError.message + " You can still fill in the form manually.";
        }
        setError(errorMessage);
        setAIParsing(false);
        setResumeUploading(false);
        setFormData((prev) => ({
          ...prev,
          resume_url: uploadedUrl,
        }));
        return;
      }

      // 4. Map parsed data to form fields
      const mappedData = mapParsedResumeToFormData(parsed_data);

      // 5. Update form with AI-extracted data
      setFormData((prev) => ({
        ...prev,
        resume_url: uploadedUrl,
        full_name: mappedData.full_name || prev.full_name,
        email: user.email, // Keep user's email
        phone_number: mappedData.phone_number || prev.phone_number,
        location: mappedData.location || prev.location,
        bio: mappedData.bio || prev.bio,
        education_level: mappedData.education_level || prev.education_level,
        years_of_experience:
          mappedData.years_of_experience || prev.years_of_experience,
        skills: {
          technical: mappedData.skills?.technical || prev.skills.technical,
          soft: mappedData.skills?.soft || prev.skills.soft,
          languages: mappedData.skills?.languages || prev.skills.languages,
          tools: mappedData.skills?.tools || prev.skills.tools,
        },
        experience: mappedData.experience || prev.experience,
      }));

      // 6. Update submission with AI parsed data
      if (submissionId) {
        const { error: dbError } = await updateStudentSubmission(submissionId, {
          resume_url: uploadedUrl,
          ai_parsed_resume: parsed_data,
          ai_extraction_confidence: confidence,
        });

        // Silently fail if database not initialized
        if (dbError && dbError.code !== "PGRST116") {
          console.error("Database update error:", dbError);
        }
      }

      // Move to next step
      setCurrentStep(1);
    } catch (err) {
      setError(err.message || "An error occurred while processing your resume");
    } finally {
      setResumeUploading(false);
      setAIParsing(false);
    }
  };

  // Handle student ID upload
  const handleStudentIDUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const { valid, error: validationError } = validateFileUpload(
      file,
      "student_id",
    );

    if (!valid) {
      setError(validationError);
      return;
    }

    if (!user || !user.id) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    setStudentIDUploading(true);

    try {
      const { url: uploadedUrl, error: uploadError } = await uploadStudentID(
        file,
        user.id,
      );

      if (uploadError) {
        setError(uploadError.message || "Failed to upload student ID");
        setStudentIDUploading(false);
        return;
      }

      setStudentIDFile(file);
      setFormData((prev) => ({
        ...prev,
        student_id_url: uploadedUrl,
      }));

      // Move to review step
      setCurrentStep(5);
    } catch (err) {
      setError(
        err.message || "An error occurred while uploading your student ID",
      );
    } finally {
      setStudentIDUploading(false);
    }
  };

  // Update form field
  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add skill
  const addSkill = (category) => {
    if (!skillInput.trim()) return;

    setFormData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...(prev.skills[category] || []), skillInput.trim()],
      },
    }));
    setSkillInput("");
  };

  // Remove skill
  const removeSkill = (category, index) => {
    setFormData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter((_, i) => i !== index),
      },
    }));
  };

  // Add experience
  const addExperience = () => {
    if (!experienceInput.trim()) return;

    setFormData((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          description: experienceInput.trim(),
          start_date: null,
          end_date: null,
        },
      ],
    }));
    setExperienceInput("");
  };

  // Remove experience
  const removeExperience = (index) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  // Submit verification
  const handleSubmit = async () => {
    if (!submissionId || !formData.student_id_url) {
      setError("Please complete all required fields and upload student ID");
      return;
    }

    if (!user || !user.id) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Transform data to match database schema
      const transformedSkills = [];
      if (formData.skills) {
        // Flatten all skill categories into a single array
        Object.values(formData.skills).forEach(categorySkills => {
          if (Array.isArray(categorySkills)) {
            transformedSkills.push(...categorySkills);
          }
        });
      }

      // Transform experience array to text (join descriptions)
      const transformedExperience = formData.experience && formData.experience.length > 0 
        ? formData.experience.map(exp => exp.description).join("\n\n")
        : "";

      // Update submission with final data AND submit for verification in one call
      // This is necessary because RLS only allows updating draft submissions
      // Combining both operations ensures the status change happens while still in draft state
      const { error: updateError } = await updateStudentSubmission(
        submissionId,
        {
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          location: formData.location,
          bio: formData.bio,
          education_level: formData.education_level,
          institution: formData.institution,
          graduation_year: formData.graduation_year,
          field_of_study: formData.field_of_study,
          skills: transformedSkills, // Convert object to array
          experience: transformedExperience, // Convert array to text
          years_of_experience: formData.years_of_experience,
          student_id_url: formData.student_id_url,
          resume_url: formData.resume_url,
          submission_status: "submitted", // Change status to submitted
          submitted_at: new Date().toISOString(), // Set submission timestamp
        },
      );

      if (updateError) {
        // Allow submission to proceed even if database isn't initialized (PGRST116 = table not found)
        if (updateError.code !== "PGRST116") {
          setError("Failed to save your information: " + (updateError.message || "Unknown error"));
          setSubmitting(false);
          return;
        }
        console.warn("Database not initialized. Data won't be persisted.");
      }

      // Update user profile (silently fail if profile doesn't exist)
      try {
        await updateStudentProfile(user.id, {
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          location: formData.location,
          bio: formData.bio,
          verification_status: "submitted",
          onboarding_completed: true,
        });
        // Persist verification status and onboarding flag to auth metadata
        try {
          await authUpdateProfile({
            verification_status: "submitted",
            onboarding_completed: true,
          });
        } catch (e) {
          console.warn("Failed to update auth metadata", e);
        }
        // Also update the local context flags so ProtectedRoute knows onboarding is done
        if (updateUserMetadata) {
          updateUserMetadata({
            onboarding_completed: true,
            verification_status: "submitted",
          });
        }
      } catch (profileError) {
        console.warn("Profile update failed (might not exist yet):", profileError);
        // Continue anyway - the submission was successful
      }

      // Navigate to home page with success message
      navigate("/", { state: { submissionSuccess: true } });
    } catch (err) {
      setError(err.message || "An error occurred while submitting");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Complete Your Profile
            </h1>
          </div>
          <p className="text-muted-foreground">
            Submit your resume and ID for verification.
          </p>
        </div>

        {/* Progress bar */}
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
              <Progress
                value={((currentStep + 1) / STEPS.length) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <Card className="border-border">
          <CardContent className="pt-6">
            {/* Resume Upload Step */}
            {currentStep === 0 && (
              <ResumeUploadStep
                {...{
                  resumeFile,
                  resumeUploading,
                  aiParsing,
                  handleResumeUpload,
                  onNext: () => setCurrentStep(1),
                }}
              />
            )}

            {/* Basic Info Step */}
            {currentStep === 1 && (
              <BasicInfoStep
                {...{
                  formData,
                  updateField,
                  onNext: () => setCurrentStep(2),
                  onPrev: () => setCurrentStep(0),
                }}
              />
            )}

            {/* Education Step */}
            {currentStep === 2 && (
              <EducationStep
                {...{
                  formData,
                  updateField,
                  onNext: () => setCurrentStep(3),
                  onPrev: () => setCurrentStep(1),
                }}
              />
            )}

            {/* Skills & Experience Step */}
            {currentStep === 3 && (
              <SkillsExperienceStep
                {...{
                  formData,
                  updateField,
                  skillInput,
                  setSkillInput,
                  experienceInput,
                  setExperienceInput,
                  addSkill,
                  removeSkill,
                  addExperience,
                  removeExperience,
                  onNext: () => setCurrentStep(4),
                  onPrev: () => setCurrentStep(2),
                }}
              />
            )}

            {/* Student ID Upload Step */}
            {currentStep === 4 && (
              <StudentIDUploadStep
                {...{
                  studentIDFile,
                  studentIDUploading,
                  handleStudentIDUpload,
                  onNext: () => setCurrentStep(5),
                  onPrev: () => setCurrentStep(3),
                }}
              />
            )}

            {/* Review & Submit Step */}
            {currentStep === 5 && (
              <ReviewStep
                {...{
                  formData,
                  submitting,
                  handleSubmit,
                  onPrev: () => setCurrentStep(4),
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* Step Components */

function ResumeUploadStep({
  resumeFile,
  resumeUploading,
  aiParsing,
  handleResumeUpload,
  onNext,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Upload Your Resume
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your resume in PDF format. Our system will analyze it and
          pre-fill your information.
        </p>
      </div>

      <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/60 transition">
        <input
          type="file"
          onChange={handleResumeUpload}
          disabled={resumeUploading || aiParsing}
          accept=".pdf"
          className="hidden"
          id="resume-upload"
        />
        <label htmlFor="resume-upload" className="cursor-pointer block">
          {resumeUploading || aiParsing ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
              <p className="text-sm font-medium text-foreground">
                {aiParsing
                  ? "Analyzing your resume..."
                  : "Uploading resume..."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <FileUp className="w-8 h-8 text-primary mx-auto" />
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PDF (max 5MB)
              </p>
            </div>
          )}
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={resumeUploading || aiParsing}
          onClick={onNext}
        >
          Skip & Fill Manually
        </Button>
      </div>
    </div>
  );
}

function BasicInfoStep({ formData, updateField, onNext, onPrev }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Basic Information
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
            placeholder="Your full name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            value={formData.email}
            disabled
            placeholder="Your email (from signup)"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone_number}
            onChange={(e) => updateField("phone_number", e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
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
          value={formData.bio}
          onChange={(e) => updateField("bio", e.target.value)}
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!formData.full_name}
          className="gradient-primary text-white border-0"
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
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Education Details
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="educationLevel">Education Level</Label>
          <Select
            value={formData.education_level}
            onValueChange={(value) => updateField("education_level", value)}
          >
            <SelectTrigger id="educationLevel">
              <SelectValue />
            </SelectTrigger>
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
            value={formData.institution}
            onChange={(e) => updateField("institution", e.target.value)}
            placeholder="Your school/university name"
          />
        </div>
        <div>
          <Label htmlFor="fieldOfStudy">Field of Study</Label>
          <Input
            id="fieldOfStudy"
            value={formData.field_of_study}
            onChange={(e) => updateField("field_of_study", e.target.value)}
            placeholder="e.g., Computer Science"
          />
        </div>
        <div>
          <Label htmlFor="graduationYear">Expected Graduation Year</Label>
          <Input
            id="graduationYear"
            type="number"
            value={formData.graduation_year}
            onChange={(e) =>
              updateField("graduation_year", parseInt(e.target.value))
            }
          />
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!formData.institution}
          className="gradient-primary text-white border-0"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function SkillsExperienceStep({
  formData,
  updateField,
  skillInput,
  setSkillInput,
  experienceInput,
  setExperienceInput,
  addSkill,
  removeSkill,
  addExperience,
  removeExperience,
  onNext,
  onPrev,
}) {
  const skillCategories = ["What you can do"];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Skills & Experience
        </h3>
      </div>

      {/* Skills */}
      <div>
        <div className="space-y-3">
          {skillCategories.map((category) => (
            <div key={category}>
              <label className="text-sm font-medium text-foreground capitalize mb-1 block">
                {category}
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder={`Add your skills and press Enter eg: JavaScript, Communication, Photoshop...`}
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addSkill(category);
                    }
                  }}
                />
                <Button
                  onClick={() => addSkill(category)}
                  variant="outline"
                  size="icon"
                  disabled={!skillInput.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills[category]?.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(category, index)}
                      className="hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Years of Experience */}
      <div>
        <Label htmlFor="yearsExp">Years of Experience</Label>
        <Input
          id="yearsExp"
          type="number"
          min="0"
          step="0.5"
          value={formData.years_of_experience}
          onChange={(e) =>
            updateField("years_of_experience", parseFloat(e.target.value))
          }
          placeholder="0"
        />
      </div>

      {/* Experience */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Work Experience</h4>
        <div className="flex gap-2 mb-3">
          <Textarea
            value={experienceInput}
            onChange={(e) => setExperienceInput(e.target.value)}
            placeholder="Describe your work experience..."
            rows={2}
          />
          <Button
            onClick={addExperience}
            variant="outline"
            size="icon"
            disabled={!experienceInput.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {formData.experience?.map((exp, index) => (
            <div
              key={index}
              className="flex justify-between items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <p className="text-sm text-foreground flex-1">
                {exp.description}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeExperience(index)}
              >
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button
          onClick={onNext}
          className="gradient-primary text-white border-0"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function StudentIDUploadStep({
  studentIDFile,
  studentIDUploading,
  handleStudentIDUpload,
  onNext,
  onPrev,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Upload Student ID
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a clear photo or scan of your student ID. This is required for
          verification.
        </p>
      </div>

      <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/60 transition">
        <input
          type="file"
          onChange={handleStudentIDUpload}
          disabled={studentIDUploading}
          accept="image/*,.pdf"
          className="hidden"
          id="student-id-upload"
        />
        <label htmlFor="student-id-upload" className="cursor-pointer block">
          {studentIDUploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
              <p className="text-sm font-medium text-foreground">
                Uploading...
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-primary mx-auto" />
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or PDF (max 10MB)
              </p>
            </div>
          )}
        </label>
      </div>

      {studentIDFile && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">
            {studentIDFile.name} uploaded successfully
          </p>
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={studentIDUploading || !studentIDFile}
          className="gradient-primary text-white border-0"
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({ formData, submitting, handleSubmit, onPrev }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Review Your Information
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Please review all the information below before submitting for admin
          verification.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>{" "}
              {formData.full_name}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>{" "}
              {formData.email}
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {formData.phone_number || "Not provided"}
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>{" "}
              {formData.location || "Not provided"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Institution:</span>{" "}
              {formData.institution}
            </div>
            <div>
              <span className="text-muted-foreground">Field:</span>{" "}
              {formData.field_of_study || "Not specified"}
            </div>
            <div>
              <span className="text-muted-foreground">Graduation Year:</span>{" "}
              {formData.graduation_year}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {formData.skills && typeof formData.skills === 'object' && Object.entries(formData.skills).map(
            ([category, skills]) =>
              Array.isArray(skills) && skills.length > 0 && (
                <div key={category}>
                  <span className="text-muted-foreground capitalize">
                    {category}:
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ),
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      <Card className="border-border/50 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {formData.resume_url && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Resume uploaded</span>
            </div>
          )}
          {formData.student_id_url && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Student ID uploaded</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Next Step:</strong> Your information will be sent to our
          admins for verification. You'll receive an email once your profile is
          verified. This usually takes 1-2 business days.
        </p>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrev} disabled={submitting}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="gradient-primary text-white border-0"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit for Verification
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
