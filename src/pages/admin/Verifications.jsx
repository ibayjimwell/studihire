// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  verificationGetSubmissions,         // student
  verificationGetClientSubmissions,   // client
  verificationGetReview,              // works for both (same admin_reviews table)
  verificationDecide,                 // student
  verificationDecideClient,           // client
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

// ── Sidebar ──
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

// ── Status styling ──
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

// ── Helper to render submission row based on type ──
function SubmissionRow({ item, type, onReview }) {
  const [expanded, setExpanded] = useState(false);

  const isStudent = type === "student";

  // Extract common fields
  const name = item.full_name ?? "—";
  const email = item.email ?? "—";
  const status = item.submission_status;

  // Student specifics
  const institution = isStudent ? (item.institution ?? "—") : null;
  const fieldOfStudy = isStudent ? (item.field_of_study ?? "—") : null;

  // Client specifics
  const companyName = !isStudent ? (item.company_name ?? "—") : null;
  const industry = !isStudent ? (item.industry ?? "—") : null;

  // Document URLs
  const documentLinks = [];
  if (isStudent) {
    if (item.student_id_url) documentLinks.push({ url: item.student_id_url, label: "Student ID", icon: Eye });
    if (item.resume_url) documentLinks.push({ url: item.resume_url, label: "Resume", icon: ExternalLink });
  } else {
    if (item.valid_id_url) documentLinks.push({ url: item.valid_id_url, label: "Valid ID", icon: Eye });
  }

  return (
    <div className="bg-white rounded-xl border border-border hover:shadow-sm transition-all">
      {/* Summary row */}
      <div className="flex items-center gap-4 p-4">
        <Avatar className="w-11 h-11 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {name[0] ?? "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-foreground">{name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
              STATUS_STYLE[status] ?? STATUS_STYLE.draft
            }`}>
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isStudent
              ? `${institution} · ${fieldOfStudy}`
              : `${companyName !== "—" ? companyName : "—"} · ${industry}`
            }
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
          {documentLinks.map((doc) => (
            <Button key={doc.label} size="sm" variant="ghost" className="gap-1 text-xs h-8" asChild>
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                <doc.icon className="w-3 h-3" /> {doc.label}
              </a>
            </Button>
          ))}
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
            onClick={() => onReview(item, type)}
          >
            <ShieldCheck className="w-3 h-3" /> Review
          </Button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div><span className="text-xs text-muted-foreground">Email: </span>{email}</div>
            {isStudent ? (
              <>
                <div><span className="text-xs text-muted-foreground">Phone: </span>{item.phone_number ?? "—"}</div>
                <div><span className="text-xs text-muted-foreground">Location: </span>{item.location ?? "—"}</div>
                <div><span className="text-xs text-muted-foreground">Education: </span>{item.education_level ?? "—"}</div>
                <div><span className="text-xs text-muted-foreground">Grad. Year: </span>{item.graduation_year ?? "—"}</div>
                <div><span className="text-xs text-muted-foreground">Exp. Years: </span>{item.years_of_experience ?? "—"}</div>
              </>
            ) : (
              <>
                <div><span className="text-xs text-muted-foreground">Company: </span>{companyName}</div>
                <div><span className="text-xs text-muted-foreground">Type: </span>{item.company_type ?? "—"}</div>
                <div><span className="text-xs text-muted-foreground">Industry: </span>{industry}</div>
                <div><span className="text-xs text-muted-foreground">Website: </span>{item.website ? <a href={item.website} target="_blank" className="text-primary underline">{item.website}</a> : "—"}</div>
              </>
            )}
          </div>

          <div className="space-y-3">
            {item.bio && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Bio</p>
                <p className="text-xs leading-relaxed line-clamp-3">{item.bio}</p>
              </div>
            )}
            {isStudent && item.skills && item.skills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {item.skills.map((s, i) => (
                    <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {isStudent && item.experience && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Experience</p>
                <p className="text-xs whitespace-pre-line line-clamp-4">{item.experience}</p>
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

  // Tab state: "student" or "client"
  const [submissionType, setSubmissionType] = useState("student");
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("submitted");
  const [search,      setSearch]      = useState("");
  const [selected,    setSelected]    = useState(null);
  const [selectedType, setSelectedType] = useState("student"); // type of the opened item
  const [deciding,    setDeciding]    = useState(false);

  // Dialog state (no checklist)
  const [comments,        setComments]        = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // ── Load submissions based on type and filter ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetchFn = submissionType === "student"
        ? verificationGetSubmissions
        : verificationGetClientSubmissions;

      const { submissions: data, error } = await fetchFn({ status: filter });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setSubmissions(data);
      }
    } finally {
      setLoading(false);
    }
  }, [submissionType, filter, toast]);

  useEffect(() => { load(); }, [load]);

  // ── Open review dialog ──
  const openReview = async (item, type) => {
    setSelected(item);
    setSelectedType(type);
    setComments(item.admin_comments ?? "");
    setRejectionReason(item.rejected_reason ?? "");
    // Fetch existing review (if any) for pre-fill
    const { review } = await verificationGetReview(item.id);
    if (review) {
      setComments(review.comments ?? item.admin_comments ?? "");
      setRejectionReason(review.rejection_reason ?? item.rejected_reason ?? "");
    }
  };

  const closeReview = () => {
    setSelected(null);
    setSelectedType("student");
    setComments("");
    setRejectionReason("");
  };

  // ── Admin decision ──
  const handleDecide = async (decision) => {
    if (!selected) return;
    setDeciding(true);

    const decideFn = selectedType === "student"
      ? verificationDecide
      : verificationDecideClient;

    const { success, error } = await decideFn({
      submissionId:    selected.id,
      userId:          selected.user_id,
      decision,
      comments,
      rejectionReason,
    });

    if (!success) {
      toast({ title: "Error", description: error?.message ?? "Action failed.", variant: "destructive" });
    } else {
      const labels = {
        approved:        "Approved ✓",
        rejected:        "Rejected",
        needs_revision:  "Revision requested",
      };
      toast({ title: labels[decision], description: `Decision recorded for ${selected.full_name}.` });
      closeReview();
      load();
    }

    setDeciding(false);
  };

  // ── Client-side search ──
  const visible = submissions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.full_name?.toLowerCase().includes(q)) ||
      (s.email?.toLowerCase().includes(q)) ||
      (submissionType === "student" && s.institution?.toLowerCase().includes(q)) ||
      (submissionType === "client" && s.company_name?.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Admin">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> Verifications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and decide on verification submissions
        </p>
      </div>

      {/* ── Type tabs ── */}
      <div className="flex gap-2 mb-6">
        {["student", "client"].map((type) => (
          <button
            key={type}
            onClick={() => { setSubmissionType(type); setFilter("submitted"); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              submissionType === type
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-white border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}s
          </button>
        ))}
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
            placeholder={submissionType === "student" ? "Search by name or school…" : "Search by name or company…"}
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
                  No {filter === "all" ? "" : STATUS_LABEL[filter]?.toLowerCase()} {submissionType} submissions.
                </p>
              </div>
            )
            : visible.map((item) => (
              <SubmissionRow
                key={item.id}
                item={item}
                type={submissionType}
                onReview={openReview}
              />
            ))
        }
      </div>

      {/* ── Review dialog (no checklist) ── */}
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
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Name</span>
                  <span className="font-medium text-right">{selected.full_name ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Email</span>
                  <span className="font-medium text-right">{selected.email ?? "—"}</span>
                </div>
                {selectedType === "student" ? (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Institution</span>
                      <span className="font-medium text-right">{selected.institution ?? "—"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Field</span>
                      <span className="font-medium text-right">{selected.field_of_study ?? "—"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Company</span>
                      <span className="font-medium text-right">{selected.company_name ?? "—"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Industry</span>
                      <span className="font-medium text-right">{selected.industry ?? "—"}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Status</span>
                  <span className="font-medium text-right">{STATUS_LABEL[selected.submission_status] ?? selected.submission_status}</span>
                </div>
              </div>

              {/* Document links */}
              <div className="flex gap-2">
                {selectedType === "student" && selected.student_id_url && (
                  <Button size="sm" variant="outline" className="flex-1 gap-1" asChild>
                    <a href={selected.student_id_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-4 h-4" /> Student ID
                    </a>
                  </Button>
                )}
                {selectedType === "student" && selected.resume_url && (
                  <Button size="sm" variant="outline" className="flex-1 gap-1" asChild>
                    <a href={selected.resume_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" /> Resume
                    </a>
                  </Button>
                )}
                {selectedType === "client" && selected.valid_id_url && (
                  <Button size="sm" variant="outline" className="flex-1 gap-1" asChild>
                    <a href={selected.valid_id_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-4 h-4" /> Valid ID
                    </a>
                  </Button>
                )}
              </div>

              {/* Rejection reason */}
              <div>
                <Label className="text-sm font-medium">
                  Rejection reason{" "}
                  <span className="text-muted-foreground font-normal">(shown to user if rejected/revised)</span>
                </Label>
                <Input
                  className="mt-1"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. ID photo is blurry"
                />
              </div>

              {/* Comments */}
              <div>
                <Label className="text-sm font-medium">
                  Admin comments{" "}
                  <span className="text-muted-foreground font-normal">(visible to user)</span>
                </Label>
                <Textarea
                  className="mt-1"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Optional feedback…"
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