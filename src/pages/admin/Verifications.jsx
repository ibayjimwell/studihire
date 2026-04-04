import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { base44 } from "@/api/mockBase44Client";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  GraduationCap,
  Briefcase,
  Eye,
  ExternalLink,
  LayoutDashboard,
  Users,
  DollarSign,
  Flag,
  AlertTriangle,
  Settings,
  FileText,
} from "lucide-react";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/gigs", label: "Gigs", icon: Briefcase },
  { href: "/admin/projects", label: "Projects", icon: FileText },
  { href: "/admin/payments", label: "Payments", icon: DollarSign },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
];

export default function AdminVerifications() {
  const [students, setStudents] = useState([]);
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedType, setSelectedType] = useState("student");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    Promise.all([
      base44.entities.StudentProfile.list("-created_date", 100),
      base44.entities.ClientProfile.list("-created_date", 100),
    ]).then(([s, c]) => {
      setStudents(s);
      setClients(c);
    });
  };

  const handleAction = async (status) => {
    if (!selected) return;
    setLoading(true);
    const entity =
      selectedType === "student"
        ? base44.entities.StudentProfile
        : base44.entities.ClientProfile;
    await entity.update(selected.id, {
      verification_status: status,
      verification_notes: notes,
    });

    // Send notification
    await base44.entities.Notification.create({
      user_id: selected.user_id,
      type: "verification_update",
      title:
        status === "approved"
          ? "✅ Verification Approved!"
          : status === "rejected"
            ? "❌ Verification Rejected"
            : "↺ Resubmission Required",
      body:
        notes ||
        (status === "approved"
          ? "Your account has been verified. You can now use all platform features."
          : "Please check the notes and resubmit."),
      is_read: false,
    });

    loadAll();
    setSelected(null);
    setNotes("");
    setLoading(false);
  };

  const openReview = (item, type) => {
    setSelected(item);
    setSelectedType(type);
    setNotes(item.verification_notes || "");
  };

  const filteredStudents = students.filter(
    (s) => filter === "all" || s.verification_status === filter,
  );
  const filteredClients = clients.filter(
    (c) => filter === "all" || c.verification_status === filter,
  );

  const renderList = (list, type) => (
    <div className="space-y-3">
      {list.length === 0 ? (
        <div className="text-center py-10">
          <CheckCircle className="w-10 h-10 text-green-500/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No {filter} {type}s
          </p>
        </div>
      ) : (
        list.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border hover:shadow-sm transition-all"
          >
            <Avatar className="w-11 h-11">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {item.full_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-foreground">
                  {item.full_name}
                </p>
                <VerificationBadge status={item.verification_status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {type === "student"
                  ? `${item.school_name || "—"} · ${item.course || "—"}`
                  : `${item.company_name || "Individual"} · ${item.industry || "—"}`}
              </p>
              {item.verification_notes && (
                <p className="text-xs text-orange-600 mt-0.5 truncate">
                  Note: {item.verification_notes}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.resume_url && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs"
                  asChild
                >
                  <a
                    href={item.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3" /> Resume
                  </a>
                </Button>
              )}
              {(item.school_id_url || item.valid_id_url) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs"
                  asChild
                >
                  <a
                    href={item.school_id_url || item.valid_id_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="w-3 h-3" /> ID
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                className="gradient-primary text-white border-0 gap-1 text-xs"
                onClick={() => openReview(item, type)}
              >
                <ShieldCheck className="w-3 h-3" /> Review
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> Verifications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and approve student and client accounts
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["pending", "approved", "rejected", "resubmit_required", "all"].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-white border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ),
        )}
      </div>

      <Tabs defaultValue="students">
        <TabsList className="mb-6 bg-muted">
          <TabsTrigger value="students" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Students ({filteredStudents.length})
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Clients ({filteredClients.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          {renderList(filteredStudents, "student")}
        </TabsContent>
        <TabsContent value="clients">
          {renderList(filteredClients, "client")}
        </TabsContent>
      </Tabs>

      {/* Review dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Review Verification
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{selected.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{selected.email}</span>
                </div>
                {selectedType === "student" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">School</span>
                      <span className="font-medium">
                        {selected.school_name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Course</span>
                      <span className="font-medium">
                        {selected.course || "—"}
                      </span>
                    </div>
                  </>
                )}
                {selectedType === "client" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company</span>
                    <span className="font-medium">
                      {selected.company_name || "Individual"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {selected.school_id_url || selected.valid_id_url ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    asChild
                  >
                    <a
                      href={selected.school_id_url || selected.valid_id_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="w-4 h-4" /> View ID
                    </a>
                  </Button>
                ) : null}
                {selected.resume_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    asChild
                  >
                    <a
                      href={selected.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" /> View Resume
                    </a>
                  </Button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Admin Notes (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note for the user..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={() => handleAction("resubmit_required")}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" /> Resubmit
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1 border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => handleAction("rejected")}
              disabled={loading}
            >
              <XCircle className="w-4 h-4" /> Reject
            </Button>
            <Button
              className="flex-1 gap-1 gradient-primary text-white border-0"
              onClick={() => handleAction("approved")}
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
