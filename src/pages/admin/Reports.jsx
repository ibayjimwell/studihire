import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { base44 } from "@/api/mockBase44Client";
import {
  Flag,
  Users,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  Settings,
  Briefcase,
  FileText,
  LayoutDashboard,
  CheckCircle,
  XCircle,
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
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const statusColors = {
  open: "bg-red-100 text-red-700",
  under_review: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  dismissed: "bg-gray-100 text-gray-700",
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    base44.entities.Report.list("-created_date", 200).then(setReports);
  }, []);

  const filtered = reports.filter(
    (r) => filter === "all" || r.status === filter,
  );

  const handleAction = async (status) => {
    setLoading(true);
    await base44.entities.Report.update(selected.id, {
      status,
      admin_notes: notes,
    });
    setReports((prev) =>
      prev.map((r) =>
        r.id === selected.id ? { ...r, status, admin_notes: notes } : r,
      ),
    );
    setSelected(null);
    setNotes("");
    setLoading(false);
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flag className="w-6 h-6 text-red-500" /> Reports
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and resolve user-submitted reports
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["open", "under_review", "resolved", "dismissed", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              No {filter} reports.
            </p>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm capitalize">
                    {r.reason?.replace("_", " ")}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[r.status] || "bg-gray-100 text-gray-700"}`}
                  >
                    {r.status?.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Content type: {r.content_type || "—"}
                </p>
                {r.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {r.description}
                  </p>
                )}
                {r.admin_notes && (
                  <p className="text-xs text-orange-600 mt-0.5">
                    Note: {r.admin_notes}
                  </p>
                )}
              </div>
              {r.status === "open" || r.status === "under_review" ? (
                <Button
                  size="sm"
                  className="gradient-primary text-white border-0 gap-1 text-xs shrink-0"
                  onClick={() => {
                    setSelected(r);
                    setNotes(r.admin_notes || "");
                  }}
                >
                  <Flag className="w-3 h-3" /> Review
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" /> Review Report
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="font-medium capitalize">
                    {selected.reason?.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Content</span>
                  <span className="font-medium">
                    {selected.content_type || "—"}
                  </span>
                </div>
                {selected.description && (
                  <p className="text-muted-foreground text-xs">
                    {selected.description}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Admin Notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 gap-1 border-gray-200 text-gray-700"
              onClick={() => handleAction("dismissed")}
              disabled={loading}
            >
              <XCircle className="w-4 h-4" /> Dismiss
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1 border-yellow-200 text-yellow-700"
              onClick={() => handleAction("under_review")}
              disabled={loading}
            >
              <Flag className="w-4 h-4" /> Under Review
            </Button>
            <Button
              className="flex-1 gap-1 gradient-primary text-white border-0"
              onClick={() => handleAction("resolved")}
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4" /> Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
