import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { base44 } from "@/api/mockBase44Client";
import {
  Briefcase,
  Search,
  Users,
  ShieldCheck,
  DollarSign,
  Flag,
  AlertTriangle,
  Settings,
  FileText,
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
  active: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-700",
  paused: "bg-yellow-100 text-yellow-700",
  removed: "bg-red-100 text-red-700",
};

export default function AdminGigs() {
  const [gigs, setGigs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.entities.Gig.list("-created_date", 200).then(setGigs);
  }, []);

  const filtered = gigs.filter((g) => {
    const matchSearch =
      !search ||
      g.title?.toLowerCase().includes(search.toLowerCase()) ||
      g.category?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || g.status === filter;
    return matchSearch && matchFilter;
  });

  const handleRemove = async (gig) => {
    await base44.entities.Gig.update(gig.id, { status: "removed" });
    setGigs((prev) =>
      prev.map((g) => (g.id === gig.id ? { ...g, status: "removed" } : g)),
    );
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" /> Gigs
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse and moderate all gig listings
        </p>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search gigs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "active", "draft", "paused", "removed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No gigs found.
          </p>
        ) : (
          filtered.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border"
            >
              {g.cover_image_url ? (
                <img
                  src={g.cover_image_url}
                  alt={g.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{g.title}</p>
                <p className="text-xs text-muted-foreground">
                  {g.category} {g.subcategory ? `· ${g.subcategory}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[g.status]}`}
                >
                  {g.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {g.total_orders || 0} orders
                </span>
                {g.status !== "removed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 gap-1 text-xs"
                    onClick={() => handleRemove(g)}
                  >
                    <Trash2 className="w-3 h-3" /> Remove
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
