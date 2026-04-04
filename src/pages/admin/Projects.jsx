import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { base44 } from "@/api/mockBase44Client";
import {
  FileText,
  Search,
  Users,
  ShieldCheck,
  DollarSign,
  Flag,
  AlertTriangle,
  Settings,
  Briefcase,
  LayoutDashboard,
  Trash2,
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
  open: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.entities.Project.list("-created_date", 200).then(setProjects);
  }, []);

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const handleClose = async (project) => {
    await base44.entities.Project.update(project.id, { status: "closed" });
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, status: "closed" } : p)),
    );
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> Projects
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and moderate all client project listings
        </p>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            "all",
            "open",
            "in_progress",
            "completed",
            "cancelled",
            "closed",
          ].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"}`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No projects found.
          </p>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.category} · Budget: ₱{p.budget_min?.toLocaleString()}–₱
                  {p.budget_max?.toLocaleString()} ({p.budget_type})
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[p.status] || "bg-gray-100 text-gray-700"}`}
                >
                  {p.status?.replace("_", " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {p.proposals_count || 0} proposals
                </span>
                {p.status !== "closed" && p.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 gap-1 text-xs"
                    onClick={() => handleClose(p)}
                  >
                    <Trash2 className="w-3 h-3" /> Close
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
