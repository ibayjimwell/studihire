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
  AlertTriangle,
  Users,
  ShieldCheck,
  DollarSign,
  Flag,
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
  resolved_client: "bg-blue-100 text-blue-700",
  resolved_student: "bg-green-100 text-green-700",
  escalated: "bg-orange-100 text-orange-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    base44.entities.Dispute.list("-created_date", 200).then(setDisputes);
  }, []);

  const filtered = disputes.filter(
    (d) => filter === "all" || d.status === filter,
  );

  const handleAction = async (status) => {
    setLoading(true);
    await base44.entities.Dispute.update(selected.id, {
      status,
      resolution_notes: notes,
    });
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === selected.id ? { ...d, status, resolution_notes: notes } : d,
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
          <AlertTriangle className="w-6 h-6 text-yellow-500" /> Disputes
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resolve payment and work disputes between users
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          "open",
          "under_review",
          "escalated",
          "resolved_client",
          "resolved_student",
          "closed",
          "all",
        ].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              No {filter} disputes.
            </p>
          </div>
        ) : (
          filtered.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm capitalize">
                    {d.reason?.replace(/_/g, " ")}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[d.status] || "bg-gray-100 text-gray-700"}`}
                  >
                    {d.status?.replace(/_/g, " ")}
                  </span>
                </div>
                {d.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {d.description}
                  </p>
                )}
                {d.resolution_notes && (
                  <p className="text-xs text-orange-600 mt-0.5">
                    Resolution: {d.resolution_notes}
                  </p>
                )}
              </div>
              {(d.status === "open" ||
                d.status === "under_review" ||
                d.status === "escalated") && (
                <Button
                  size="sm"
                  className="gradient-primary text-white border-0 gap-1 text-xs shrink-0"
                  onClick={() => {
                    setSelected(d);
                    setNotes(d.resolution_notes || "");
                  }}
                >
                  <AlertTriangle className="w-3 h-3" /> Resolve
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" /> Resolve
              Dispute
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="font-medium capitalize">
                    {selected.reason?.replace(/_/g, " ")}
                  </span>
                </div>
                {selected.description && (
                  <p className="text-xs text-muted-foreground">
                    {selected.description}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Resolution Notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain the resolution..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 pt-2 flex-wrap">
            <Button
              variant="outline"
              className="flex-1 gap-1 border-orange-200 text-orange-700"
              onClick={() => handleAction("escalated")}
              disabled={loading}
            >
              Escalate
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1 border-blue-200 text-blue-700"
              onClick={() => handleAction("resolved_client")}
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4" /> Client Wins
            </Button>
            <Button
              className="flex-1 gap-1 gradient-primary text-white border-0"
              onClick={() => handleAction("resolved_student")}
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4" /> Student Wins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
