// @ts-nocheck
/**
 * StudentProfile — /student/profile
 *
 * Data sources:
 *  - student_profiles  → editable: bio, phone_number, location
 *                        read: full_name, email, verification_status, profile_image_url
 *  - student_submissions → read-only: institution, field_of_study, graduation_year,
 *                          education_level, skills[], experience, years_of_experience
 *  - admin_reviews     → read: rejection_reason, comments (for the status banner)
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { useToast } from "@/components/ui/use-toast";
import {
  profileGetMine,
  profileGetMySubmission,
  profileGetAdminReview,
  profileUpdateEditable,
} from "@/api/profileApi";
import {
  credentialGetMine,
  credentialCreate,
  credentialDelete,
} from "@/api/credentialApi";
import {
  GraduationCap,
  Briefcase,
  Star,
  MapPin,
  Mail,
  Phone,
  BookOpen,
  Award,
  LayoutDashboard,
  MessageSquare,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Shield,
  ShieldCheck,
} from "lucide-react";

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
const sidebarLinks = [
  { href: "/student/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/student/gigs",      label: "My Gigs",    icon: Briefcase },
  { href: "/messages",          label: "Messages",   icon: MessageSquare },
  { href: "/student/payments",  label: "Earnings",   icon: DollarSign },
  { href: "/student/profile",   label: "My Profile", icon: GraduationCap },
];

// ─────────────────────────────────────────────
// Verification banner
// ─────────────────────────────────────────────
function VerificationBanner({ status, review }) {
  const BANNER = {
    pending: {
      bg: "bg-muted/60 border-border", Icon: Clock, iconCls: "text-muted-foreground",
      title: "Profile not yet submitted",
      bodyFn: () => "Complete your onboarding to submit your details for admin verification.",
      cta: { label: "Complete Onboarding", href: "/student/onboarding" },
    },
    submitted: {
      bg: "bg-blue-50 border-blue-200", Icon: Clock, iconCls: "text-blue-600",
      title: "Verification under review",
      bodyFn: () => "Your submission is in our admin queue. This usually takes 1–2 business days.",
      cta: null,
    },
    approved: {
      bg: "bg-green-50 border-green-200", Icon: CheckCircle, iconCls: "text-green-600",
      title: "Account verified ✓",
      bodyFn: () => "Your student account is verified. You can now create and publish gigs.",
      cta: null,
    },
    rejected: {
      bg: "bg-red-50 border-red-200", Icon: XCircle, iconCls: "text-red-600",
      title: "Verification rejected",
      bodyFn: (reason, comments) => reason || comments || "Your submission was rejected.",
      cta: { label: "Resubmit", href: "/student/onboarding" },
    },
    needs_revision: {
      bg: "bg-orange-50 border-orange-200", Icon: RefreshCw, iconCls: "text-orange-600",
      title: "Revision required",
      bodyFn: (reason, comments) => comments || reason || "An admin has requested changes.",
      cta: { label: "Resubmit", href: "/student/onboarding" },
    },
  };

  const cfg = BANNER[status] ?? BANNER.pending;
  const { Icon } = cfg;
  const reason = review?.rejection_reason ?? "";
  const comments = review?.comments ?? "";
  const titleCls = cfg.iconCls.replace("-600", "-800");

  return (
    <div className={`border rounded-xl p-4 flex items-start gap-3 ${cfg.bg}`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconCls}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${titleCls}`}>{cfg.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cfg.bodyFn(reason, comments)}</p>
        {cfg.cta && (
          <Button size="sm" variant="outline" className="mt-2 text-xs h-7" asChild>
            <Link to={cfg.cta.href}>{cfg.cta.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Inline-editable card wrapper
// ─────────────────────────────────────────────
function EditableCard({ title, editing, onEdit, onSave, onCancel, saving, view, form }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {!editing ? (
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onEdit}>
            <Edit3 className="w-3 h-3" /> Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel} disabled={saving}>
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
            <Button size="sm" className="h-7 text-xs gradient-primary text-white border-0 gap-1" onClick={onSave} disabled={saving}>
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>{editing ? form : view}</CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Credentials Section Component
// ─────────────────────────────────────────────
function CredentialsSection() {
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("certificate");
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");

  useEffect(() => { loadCredentials(); }, []);

  const loadCredentials = async () => {
    setLoading(true);
    const { credentials: data } = await credentialGetMine();
    setCredentials(data);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setIssuer(""); setDescription("");
    setCategory("certificate"); setFile(null); setExtractedText("");
  };

  const handleAddCredential = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Title is required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { credential, error } = await credentialCreate({
      title: title.trim(), issuer: issuer.trim(), description: description.trim(),
      category, file: file || undefined, extracted_text: extractedText.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Credential added! 🎓" });
      setShowForm(false);
      resetForm();
      loadCredentials();
    }
    setSubmitting(false);
  };

  const handleDelete = async (credentialId) => {
    const { error } = await credentialDelete(credentialId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Credential removed" });
      loadCredentials();
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 50) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 20) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-500 bg-gray-50 border-gray-200";
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "certificate": return <Award className="w-4 h-4 text-primary" />;
      case "award":       return <Shield className="w-4 h-4 text-yellow-500" />;
      case "badge":       return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      case "license":     return <FileText className="w-4 h-4 text-green-500" />;
      default:            return <Award className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          Credentials
          {credentials.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{credentials.length}</Badge>
          )}
        </CardTitle>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}>
          <Plus className="w-3 h-3" /> {showForm ? "Cancel" : "Add"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3 mb-4">
            <p className="text-xs font-semibold text-foreground">New Credential</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Title *</Label>
                <Input className="mt-1 h-9 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. React Developer Certificate" />
              </div>
              <div>
                <Label className="text-xs">Issuer</Label>
                <Input className="mt-1 h-9 text-sm" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="e.g. Coursera, Google, University" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea className="mt-1 text-sm" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you achieve or learn?" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-foreground">
                  <option value="certificate">Certificate</option>
                  <option value="award">Award</option>
                  <option value="badge">Badge</option>
                  <option value="license">License</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Upload File (optional)</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="mt-1 h-9 text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Extracted Text (OCR, optional)</Label>
              <Textarea className="mt-1 text-sm" rows={2} value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="Paste text extracted from your credential image/PDF..." />
              <p className="text-[10px] text-muted-foreground mt-0.5">Helps validate your credential. You can use OCR tools to extract text from images.</p>
            </div>
            <Button size="sm" className="gradient-primary text-white border-0 gap-1" onClick={handleAddCredential} disabled={submitting || !title.trim()}>
              {submitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add Credential
            </Button>
          </div>
        )}

        {credentials.length === 0 ? (
          <div className="text-center py-6">
            <Award className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No credentials yet — add certificates, awards, and badges to boost your profile!</p>
            <p className="text-xs text-muted-foreground mt-1">Credentials help you stand out in search and gig listings.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {credentials.map((cred) => (
              <div key={cred.id} className="flex items-start gap-3 p-3 bg-white border border-border rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {getCategoryIcon(cred.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{cred.title}</p>
                    {cred.is_verified && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0 h-4">Verified ✓</Badge>
                    )}
                  </div>
                  {cred.issuer && <p className="text-xs text-muted-foreground">{cred.issuer}</p>}
                  {cred.description && <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{cred.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getScoreColor(cred.validity_score)}`}>
                      Score: {cred.validity_score}
                    </span>
                    {cred.file_url && (
                      <a href={cred.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        <ExternalLink className="w-2.5 h-2.5" /> View File
                      </a>
                    )}
                    <span className="text-[10px] text-muted-foreground capitalize">{cred.category}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(cred.id)}
                  className="text-muted-foreground/30 hover:text-red-500 transition-colors shrink-0 mt-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Card className="border-border overflow-hidden">
        <Skeleton className="h-28 w-full rounded-none" />
        <CardContent className="px-6 pb-6 pt-4 flex gap-4">
          <Skeleton className="w-20 h-20 rounded-full -mt-10 shrink-0" />
          <div className="flex-1 space-y-2 pt-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function StudentProfile() {
  const { user }  = useCurrentUser();
  const { toast } = useToast();

  const [profile,    setProfile]    = useState(null);
  const [submission, setSubmission] = useState(null);
  const [review,     setReview]     = useState(null);
  const [loading,    setLoading]    = useState(true);

  const [editingBio,     setEditingBio]     = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [savingBio,      setSavingBio]      = useState(false);
  const [savingContact,  setSavingContact]  = useState(false);

  const [bioDraft,      setBioDraft]      = useState("");
  const [phoneDraft,    setPhoneDraft]    = useState("");
  const [locationDraft, setLocationDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ profile: p }, { submission: s }] = await Promise.all([
      profileGetMine(),
      profileGetMySubmission(),
    ]);
    setProfile(p);
    setSubmission(s);
    if (s?.id && s.submission_status !== "draft") {
      const { review: r } = await profileGetAdminReview(s.id);
      setReview(r);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const verStatus = review?.review_status ?? profile?.verification_status ?? (submission ? "submitted" : "pending");

  const startEditBio = () => { setBioDraft(profile?.bio ?? ""); setEditingBio(true); };
  const startEditContact = () => {
    setPhoneDraft(profile?.phone_number ?? "");
    setLocationDraft(profile?.location ?? "");
    setEditingContact(true);
  };

  const saveBio = async () => {
    setSavingBio(true);
    const { profile: updated, error } = await profileUpdateEditable({ bio: bioDraft });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile((p) => ({ ...p, bio: updated.bio }));
      setEditingBio(false);
      toast({ title: "Bio updated" });
    }
    setSavingBio(false);
  };

  const saveContact = async () => {
    setSavingContact(true);
    const { profile: updated, error } = await profileUpdateEditable({
      phone_number: phoneDraft, location: locationDraft,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile((p) => ({ ...p, phone_number: updated.phone_number, location: updated.location }));
      setEditingContact(false);
      toast({ title: "Contact info updated" });
    }
    setSavingContact(false);
  };

  if (loading) {
    return (
      <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
        <ProfileSkeleton />
      </DashboardLayout>
    );
  }

  if (!profile && !submission) {
    return (
      <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
        <div className="text-center py-20">
          <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold text-foreground">No profile found</p>
          <p className="text-sm text-muted-foreground mt-1">Complete your onboarding to set up your student profile.</p>
          <Button className="mt-4 gradient-primary text-white border-0" asChild>
            <Link to="/student/onboarding">Complete Onboarding</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const name           = profile?.full_name           ?? submission?.full_name    ?? "Student";
  const email          = profile?.email               ?? submission?.email        ?? user?.email ?? "";
  const phone          = profile?.phone_number        ?? "";
  const location       = profile?.location            ?? "";
  const bio            = profile?.bio                 ?? "";
  const avatarUrl      = profile?.profile_image_url   ?? null;
  const institution    = submission?.institution      ?? "—";
  const fieldOfStudy   = submission?.field_of_study   ?? "—";
  const graduationYear = submission?.graduation_year  ?? "—";
  const educationLevel = submission?.education_level  ?? "—";
  const yearsExp       = submission?.years_of_experience;
  const experience     = submission?.experience       ?? "";
  const skills         = Array.isArray(submission?.skills) ? submission.skills : [];

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
      <div className="max-w-4xl mx-auto space-y-5">
        <VerificationBanner status={verStatus} review={review} />

        {/* Hero card */}
        <Card className="border-border overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/30" />
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              <Avatar className="w-20 h-20 border-4 border-white shadow-md shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {name?.[0] ?? "S"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{name}</h1>
                  <VerificationBadge status={verStatus} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {fieldOfStudy !== "—" ? `${fieldOfStudy} · ` : ""}{institution}
                </p>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {email}</span>
                  {phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {phone}</span>}
                  {location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {location}</span>}
                </div>
              </div>
              <div className="flex gap-5 sm:pb-1 shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{profile?.rating ? profile.rating.toFixed(1) : "—"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-center"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">₱{(profile?.total_earnings ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Earned</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic info */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Academic Information
              <span className="ml-auto text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Locked · From onboarding</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: "Institution", value: institution },
                { label: "Field of Study", value: fieldOfStudy },
                { label: "Grad. Year", value: graduationYear },
                { label: "Education Level", value: educationLevel },
                { label: "Exp. Years", value: yearsExp != null ? `${yearsExp} yr${yearsExp !== 1 ? "s" : ""}` : "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium text-foreground mt-0.5">{String(value)}</p>
                </div>
              ))}
            </div>
            {skills.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                </div>
              </div>
            )}
            {experience && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Award className="w-3 h-3" /> Work Experience</p>
                <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">{experience}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bio */}
        <EditableCard title="About Me" editing={editingBio} onEdit={startEditBio}
          onSave={saveBio} onCancel={() => setEditingBio(false)} saving={savingBio}
          view={bio ? <p className="text-sm text-foreground/80 leading-relaxed">{bio}</p> : <p className="text-sm text-muted-foreground italic">No bio yet — click Edit to add one.</p>}
          form={<Textarea rows={4} value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} placeholder="Tell clients about yourself, your strengths, and what you offer…" />}
        />

        {/* Contact */}
        <EditableCard title="Contact Info" editing={editingContact} onEdit={startEditContact}
          onSave={saveContact} onCancel={() => setEditingContact(false)} saving={savingContact}
          view={
            <div className="space-y-2 text-sm">
              {phone && <p className="flex items-center gap-2 text-foreground/80"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> {phone}</p>}
              {location && <p className="flex items-center gap-2 text-foreground/80"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {location}</p>}
              {!phone && !location && <p className="text-muted-foreground italic">No contact info — click Edit to add.</p>}
            </div>
          }
          form={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input className="mt-1" value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} placeholder="+63 912 345 6789" />
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Input className="mt-1" value={locationDraft} onChange={(e) => setLocationDraft(e.target.value)} placeholder="City, Province" />
              </div>
            </div>
          }
        />

        <CredentialsSection />
      </div>
    </DashboardLayout>
  );
}