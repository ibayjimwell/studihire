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
// Verification banner config
// status values from student_profiles.verification_status +
// admin_reviews.review_status mapped to student_profiles
// ─────────────────────────────────────────────
const BANNER = {
  // Student just signed up — no submission yet
  pending: {
    bg:      "bg-muted/60 border-border",
    Icon:    Clock,
    iconCls: "text-muted-foreground",
    title:   "Profile not yet submitted",
    bodyFn:  () => "Complete your onboarding to submit your details for admin verification.",
    cta:     { label: "Complete Onboarding", href: "/student/onboarding" },
  },
  // Student submitted — awaiting admin
  submitted: {
    bg:      "bg-blue-50 border-blue-200",
    Icon:    Clock,
    iconCls: "text-blue-600",
    title:   "Verification under review",
    bodyFn:  () => "Your submission is in our admin queue. This usually takes 1–2 business days.",
    cta:     null,
  },
  // Admin approved
  approved: {
    bg:      "bg-green-50 border-green-200",
    Icon:    CheckCircle,
    iconCls: "text-green-600",
    title:   "Account verified ✓",
    bodyFn:  () => "Your student account is verified. You can now create and publish gigs.",
    cta:     null,
  },
  // Admin rejected
  rejected: {
    bg:      "bg-red-50 border-red-200",
    Icon:    XCircle,
    iconCls: "text-red-600",
    title:   "Verification rejected",
    bodyFn:  (reason, comments) =>
      reason || comments || "Your submission was rejected. Please review the notes and resubmit.",
    cta:     { label: "Resubmit", href: "/student/onboarding" },
  },
  // Admin requested changes
  needs_revision: {
    bg:      "bg-orange-50 border-orange-200",
    Icon:    RefreshCw,
    iconCls: "text-orange-600",
    title:   "Revision required",
    bodyFn:  (reason, comments) =>
      comments || reason || "An admin has requested changes to your submission. Please review and resubmit.",
    cta:     { label: "Resubmit", href: "/student/onboarding" },
  },
};

function VerificationBanner({ status, review }) {
  const cfg = BANNER[status] ?? BANNER.pending;
  const { Icon } = cfg;

  const reason   = review?.rejection_reason ?? "";
  const comments = review?.comments         ?? "";
  const body     = cfg.bodyFn(reason, comments);

  // Derive text-color class from icon class (e.g. text-blue-600 → text-blue-800)
  const titleCls = cfg.iconCls.replace("-600", "-800");

  return (
    <div className={`border rounded-xl p-4 flex items-start gap-3 ${cfg.bg}`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconCls}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${titleCls}`}>{cfg.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
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
          <Button
            size="sm" variant="ghost"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <Edit3 className="w-3 h-3" /> Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel} disabled={saving}>
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gradient-primary text-white border-0 gap-1"
              onClick={onSave}
              disabled={saving}
            >
              {saving
                ? <RefreshCw className="w-3 h-3 animate-spin" />
                : <Save className="w-3 h-3" />
              }
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

  // Edit state
  const [editingBio,     setEditingBio]     = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [savingBio,      setSavingBio]      = useState(false);
  const [savingContact,  setSavingContact]  = useState(false);

  // Draft values
  const [bioDraft,      setBioDraft]      = useState("");
  const [phoneDraft,    setPhoneDraft]    = useState("");
  const [locationDraft, setLocationDraft] = useState("");

  // ── Load ──────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);

    const [{ profile: p }, { submission: s }] = await Promise.all([
      profileGetMine(),
      profileGetMySubmission(),
    ]);

    setProfile(p);
    setSubmission(s);

    // Load admin review only if there's a submitted submission
    if (s?.id && s.submission_status !== "draft") {
      const { review: r } = await profileGetAdminReview(s.id);
      setReview(r);
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Determine effective verification status ───
  // Prefer the most recently acted-on status:
  // admin_reviews.review_status > student_profiles.verification_status
  const verStatus = review?.review_status
    ?? profile?.verification_status
    ?? (submission ? "submitted" : "pending");

  // ── Seed drafts ────────────────────────────────
  const startEditBio = () => {
    setBioDraft(profile?.bio ?? "");
    setEditingBio(true);
  };
  const startEditContact = () => {
    setPhoneDraft(phoneDraft !== "" ? phoneDraft : (profile?.phone_number ?? ""));
    setLocationDraft(locationDraft !== "" ? locationDraft : (profile?.location ?? ""));
    setEditingContact(true);
  };

  // ── Save bio ───────────────────────────────────
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

  // ── Save contact ───────────────────────────────
  const saveContact = async () => {
    setSavingContact(true);
    const { profile: updated, error } = await profileUpdateEditable({
      phone_number: phoneDraft,
      location:     locationDraft,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile((p) => ({
        ...p,
        phone_number: updated.phone_number,
        location:     updated.location,
      }));
      setEditingContact(false);
      toast({ title: "Contact info updated" });
    }
    setSavingContact(false);
  };

  // ── Render ────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
        <ProfileSkeleton />
      </DashboardLayout>
    );
  }

  // No data at all — never started onboarding
  if (!profile && !submission) {
    return (
      <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
        <div className="text-center py-20">
          <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold text-foreground">No profile found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete your onboarding to set up your student profile.
          </p>
          <Button className="mt-4 gradient-primary text-white border-0" asChild>
            <Link to="/student/onboarding">Complete Onboarding</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Derive display values — profile takes priority for mutable fields,
  // submission for read-only academic fields.
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

        {/* ── Verification banner ── */}
        <VerificationBanner status={verStatus} review={review} />

        {/* ── Hero card ── */}
        <Card className="border-border overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/30" />
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              {/* Avatar */}
              <Avatar className="w-20 h-20 border-4 border-white shadow-md shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {name?.[0] ?? "S"}
                </AvatarFallback>
              </Avatar>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{name}</h1>
                  <VerificationBadge status={verStatus} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {fieldOfStudy !== "—" ? `${fieldOfStudy} · ` : ""}
                  {institution}
                </p>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {email}
                  </span>
                  {phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {phone}
                    </span>
                  )}
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {location}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-5 sm:pb-1 shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">
                    {profile?.rating ? profile.rating.toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-center">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Rating
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">
                    ₱{(profile?.total_earnings ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Earned</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Read-only: Academic info from submission ── */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Academic Information
              <span className="ml-auto text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Locked · From onboarding
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: "Institution",     value: institution },
                { label: "Field of Study",  value: fieldOfStudy },
                { label: "Grad. Year",      value: graduationYear },
                { label: "Education Level", value: educationLevel },
                { label: "Exp. Years",      value: yearsExp != null ? `${yearsExp} yr${yearsExp !== 1 ? "s" : ""}` : "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium text-foreground mt-0.5">{String(value)}</p>
                </div>
              ))}
            </div>

            {/* Skills from submission */}
            {skills.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience from submission */}
            {experience && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Work Experience
                </p>
                <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                  {experience}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Editable: Bio ── */}
        <EditableCard
          title="About Me"
          editing={editingBio}
          onEdit={startEditBio}
          onSave={saveBio}
          onCancel={() => setEditingBio(false)}
          saving={savingBio}
          view={
            bio
              ? <p className="text-sm text-foreground/80 leading-relaxed">{bio}</p>
              : <p className="text-sm text-muted-foreground italic">No bio yet — click Edit to add one.</p>
          }
          form={
            <Textarea
              rows={4}
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              placeholder="Tell clients about yourself, your strengths, and what you offer…"
            />
          }
        />

        {/* ── Editable: Contact info ── */}
        <EditableCard
          title="Contact Info"
          editing={editingContact}
          onEdit={startEditContact}
          onSave={saveContact}
          onCancel={() => setEditingContact(false)}
          saving={savingContact}
          view={
            <div className="space-y-2 text-sm">
              {phone && (
                <p className="flex items-center gap-2 text-foreground/80">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {phone}
                </p>
              )}
              {location && (
                <p className="flex items-center gap-2 text-foreground/80">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {location}
                </p>
              )}
              {!phone && !location && (
                <p className="text-muted-foreground italic">No contact info — click Edit to add.</p>
              )}
            </div>
          }
          form={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input
                  className="mt-1"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  placeholder="+63 912 345 6789"
                />
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Input
                  className="mt-1"
                  value={locationDraft}
                  onChange={(e) => setLocationDraft(e.target.value)}
                  placeholder="City, Province"
                />
              </div>
            </div>
          }
        />

      </div>
    </DashboardLayout>
  );
}