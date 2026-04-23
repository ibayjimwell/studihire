/**
 * AdminVerifications — /admin/verifications
 *
 * Reads:   student_submissions (list + detail)
 * Writes:  admin_reviews (upsert) + student_submissions + student_profiles
 *          via verificationDecide()
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { useToast } from "@/components/ui/use-toast";
import {
  verificationGetSubmissions,
  verificationGetReview,
  verificationDecide,
} from "@/api/verificationApi";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  ExternalLink,
  LayoutDashboard,
  Users,
  DollarSign,
  Flag,
  AlertTriangle,
  FileText,
  Briefcase,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
const sidebarLinks = [
  { href: "/admin",               label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/users",         label: "Users",         icon: Users },
  { href: "/admin/gigs",          label: "Gigs",          icon: Briefcase },
  { href: "/admin/projects",      label: "Projects",      icon: FileText },
  { href: "/admin/payments",      label: "Payments",      icon: DollarSign },
  { href: "/admin/reports",       label: "Reports",       icon: Flag },
  { href: "/admin/disputes",      label: "Disputes",      icon: AlertTriangle },
];

// ─────────────────────────────────────────────
// Status pill config
// ─────────────────────────────────────────────
const STATUS_STYLE = {
  submitted:      "bg-blue-100 text-blue-700 border-blue-200",
  approved:       "bg-green-100 text-green-700 border-green-200",
  rejected:       "bg-red-100 text-red-700 border-red-200",
  needs_revision: "bg-orange-100 text-orange-700 border-orange-200",
  draft:          "bg-gray-100 text-gray-500 border-gray-200",
};
const STATUS_LABEL = {
  submitted:      "Awaiting Review",
  approved:       "Approved",
  rejected:       "Rejected",
  needs_revision: "Revision Needed",
  draft:          "Draft",
};

const FILTER_OPTIONS = [
  { value: "submitted",      label: "Awaiting Review" },
  { value: "approved",       label: "Approved" },
  { value: "rejected",       label: "Rejected" },
  { value: "needs_revision", label: "Needs Revision" },
  { value: "all",            label: "All" },
];

// Checklist labels mapped to verificationDecide checklist keys
const CHECKLIST_ITEMS = [
  { key: "basicInfo",  label: "Basic info verified" },
  { key: "education",  label: "Education verified" },
  { key: "skills",     label: "Skills verified" },
  { key: "experience", label: "Experience verified" },
  { key: "documents",  label: "Documents complete" },
  { key: "studentId",  label: "Student ID verified" },
];

// ─────────────────────────────────────────────
// Expandable submission row
// ─────────────────────────────────────────────
function SubmissionRow({ item, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const skills = Array.isArray(item.skills) ? item.skills : [];

  return (
    <div className="bg-white rounded-xl border border-border hover:shadow-sm transition-all">
      {/* ── Summary row ── */}
      <div className="flex items-center gap-4 p-4">
        <Avatar className="w-11 h-11 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {item.full_name?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-foreground">{item.full_name ?? "—"}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[item.submission_status] ?? STATUS_STYLE.draft}`}>
              {STATUS_LABEL[item.submission_status] ?? item.submission_status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.institution ?? "—"} · {item.field_of_study ?? "—"}
          </p>
          {item.submitted_at && (
            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Submitted {new Date(item.submitted_at).toLocaleDateString(undefined, {
                year: "numeric", month: "short", day: "numeric",
              })}
            </p>
          )}
          {item.admin_comments && (
            <p className="text-xs text-orange-600 mt-0.5 truncate">
              Last note: {item.admin_comments}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {item.resume_url && (
            <Button size="sm" variant="ghost" className="gap-1 text-xs h-8" asChild>
              <a href={item.resume_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" /> Resume
              </a>
            </Button>
          )}
          {item.student_id_url && (
            <Button size="sm" variant="ghost" className="gap-1 text-xs h-8" asChild>
              <a href={item.student_id_url} target="_blank" rel="noopener noreferrer">
                <Eye className="w-3 h-3" /> ID
              </a>
            </Button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <Button
            size="sm"
            className="gradient-primary text-white border-0 gap-1 text-xs h-8"
            onClick={() => onReview(item)}
          >
            <ShieldCheck className="w-3 h-3" /> Review
          </Button>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            {[
              ["Email",          item.email           ?? "—"],
              ["Phone",          item.phone_number     ?? "—"],
              ["Location",       item.location         ?? "—"],
              ["Education",      item.education_level  ?? "—"],
              ["Grad. Year",     item.graduation_year  ?? "—"],
              ["Exp. Years",     item.years_of_experience != null ? String(item.years_of_experience) : "—"],
            ].map(([label, val]) => (
              <div key={label}>
                <span className="text-xs text-muted-foreground">{label}: </span>
                <span className="font-medium">{val}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {item.bio && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Bio</p>
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{item.bio}</p>
              </div>
            )}
            {skills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {skills.map((s, i) => (
                    <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {item.experience && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Experience</p>
                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line line-clamp-4">
                  {item.experience}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
      <Skeleton className="w-11 h-11 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function AdminVerifications() {
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("submitted");
  const [search,      setSearch]      = useState("");
  const [selected,    setSelected]    = useState(null);
  const [deciding,    setDeciding]    = useState(false);

  // Review dialog state
  const [comments,        setComments]        = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [checklist,       setChecklist]       = useState({});

  // ── Load ──────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const { submissions: data, error } = await verificationGetSubmissions({ status: filter });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSubmissions(data);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // ── Open review dialog ─────────────────────────
  const openReview = async (item) => {
    setSelected(item);
    setComments(item.admin_comments ?? "");
    setRejectionReason(item.rejected_reason ?? "");
    setChecklist({});

    // Pre-fill checklist from existing admin_review if one exists
    const { review } = await verificationGetReview(item.id);
    if (review) {
      setChecklist({
        basicInfo:  review.basic_info_verified  ?? false,
        education:  review.education_verified   ?? false,
        skills:     review.skills_verified      ?? false,
        experience: review.experience_verified  ?? false,
        documents:  review.documents_verified   ?? false,
        studentId:  review.student_id_verified  ?? false,
      });
      setComments(review.comments ?? item.admin_comments ?? "");
      setRejectionReason(review.rejection_reason ?? item.rejected_reason ?? "");
    }
  };

  const closeReview = () => {
    setSelected(null);
    setComments("");
    setRejectionReason("");
    setChecklist({});
  };

  // ── Admin decision ─────────────────────────────
  const handleDecide = async (decision) => {
    if (!selected) return;
    setDeciding(true);

    const { success, error } = await verificationDecide({
      submissionId:    selected.id,
      userId:          selected.user_id,
      decision,
      comments,
      rejectionReason,
      checklist,
    });

    if (!success) {
      toast({ title: "Error", description: error?.message ?? "Action failed.", variant: "destructive" });
    } else {
      const labels = {
        approved:        "Approved ✓",
        rejected:        "Rejected",
        needs_revision:  "Revision requested",
      };
      toast({
        title:       labels[decision],
        description: `Decision recorded for ${selected.full_name}.`,
      });
      closeReview();
      load();
    }

    setDeciding(false);
  };

  // ── Client-side search ─────────────────────────
  const visible = submissions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q)   ||
      s.email?.toLowerCase().includes(q)        ||
      s.institution?.toLowerCase().includes(q)
    );
  });

  const toggleCheck = (key) =>
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const allChecked = CHECKLIST_ITEMS.every((item) => checklist[item.key]);

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Admin">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> Verifications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and decide on student verification submissions
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                filter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-white border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or school…"
            className="pl-9 bg-white text-sm h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!loading && (
        <p className="text-sm text-muted-foreground mb-4">
          {visible.length} {visible.length === 1 ? "submission" : "submissions"} found
        </p>
      )}

      {/* ── List ── */}
      <div className="space-y-3">
        {loading
          ? Array(4).fill(0).map((_, i) => <RowSkeleton key={i} />)
          : visible.length === 0
            ? (
              <div className="text-center py-20">
                <CheckCircle className="w-12 h-12 text-green-400/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground">All clear!</p>
                <p className="text-muted-foreground text-sm mt-1">
                  No {filter === "all" ? "" : STATUS_LABEL[filter]?.toLowerCase()} submissions.
                </p>
              </div>
            )
            : visible.map((item) => (
              <SubmissionRow key={item.id} item={item} onReview={openReview} />
            ))
        }
      </div>

      {/* ── Review dialog ── */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) closeReview(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Review: {selected?.full_name}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 py-1">
              {/* Summary */}
              <div className="p-4 bg-muted/40 rounded-xl space-y-2 text-sm">
                {[
                  ["Name",        selected.full_name         ?? "—"],
                  ["Email",       selected.email             ?? "—"],
                  ["Institution", selected.institution       ?? "—"],
                  ["Field",       selected.field_of_study    ?? "—"],
                  ["Grad Year",   selected.graduation_year   ?? "—"],
                  ["Status",      STATUS_LABEL[selected.submission_status] ?? selected.submission_status],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">{label}</span>
                    <span className="font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>

              {/* Document links */}
              <div className="flex gap-2">
                {selected.student_id_url && (
                  <Button size="sm" variant="outline" className="flex-1 gap-1" asChild>
                    <a href={selected.student_id_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-4 h-4" /> Student ID
                    </a>
                  </Button>
                )}
                {selected.resume_url && (
                  <Button size="sm" variant="outline" className="flex-1 gap-1" asChild>
                    <a href={selected.resume_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" /> Resume
                    </a>
                  </Button>
                )}
              </div>

              {/* Skills */}
              {Array.isArray(selected.skills) && selected.skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.skills.map((s, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Verification Checklist</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    allChecked ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length}/{CHECKLIST_ITEMS.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CHECKLIST_ITEMS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={key}
                        checked={!!checklist[key]}
                        onCheckedChange={() => toggleCheck(key)}
                      />
                      <label htmlFor={key} className="text-xs text-foreground cursor-pointer select-none">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection reason */}
              <div>
                <Label className="text-sm font-medium">
                  Rejection reason{" "}
                  <span className="text-muted-foreground font-normal">(shown to student if rejected/revised)</span>
                </Label>
                <Input
                  className="mt-1"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Student ID photo is blurry"
                />
              </div>

              {/* Comments */}
              <div>
                <Label className="text-sm font-medium">
                  Admin comments{" "}
                  <span className="text-muted-foreground font-normal">(visible to student)</span>
                </Label>
                <Textarea
                  className="mt-1"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Optional feedback for the student…"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 gap-1.5 border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={() => handleDecide("needs_revision")}
              disabled={deciding}
            >
              <RefreshCw className="w-4 h-4" /> Request Revision
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => handleDecide("rejected")}
              disabled={deciding}
            >
              <XCircle className="w-4 h-4" /> Reject
            </Button>
            <Button
              className="flex-1 gap-1.5 gradient-primary text-white border-0"
              onClick={() => handleDecide("approved")}
              disabled={deciding}
            >
              {deciding
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <CheckCircle className="w-4 h-4" />
              }
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}