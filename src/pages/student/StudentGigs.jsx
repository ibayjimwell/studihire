/**
 * StudentGigs.jsx
 * Route: /student/gigs
 *
 * Lets a student view, filter, pause/activate, and delete their own gigs.
 * "Create Gig" and "Edit Gig" route to the existing /student/gigs/new page
 * (edit support can be added there later via a gigId URL param).
 */

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  gigGetMyGigs,
  gigDelete,
  gigSetStatus,
} from "@/api/gigApi";
import {
  Briefcase,
  LayoutDashboard,
  MessageSquare,
  DollarSign,
  GraduationCap,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Pause,
  Play,
  Trash2,
  Star,
  Clock,
  TrendingUp,
  PackageOpen,
  Edit,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─────────────────────────────────────────────
// Sidebar config (mirrors Dashboard.jsx)
// ─────────────────────────────────────────────
const sidebarLinks = [
  { href: "/student/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/student/gigs",      label: "My Gigs",    icon: Briefcase },
  { href: "/messages",          label: "Messages",   icon: MessageSquare },
  { href: "/student/payments",  label: "Earnings",   icon: DollarSign },
  { href: "/student/profile",   label: "My Profile", icon: GraduationCap },
];

// ─────────────────────────────────────────────
// Status pill styling
// ─────────────────────────────────────────────
const STATUS_STYLES = {
  active:  "bg-green-100 text-green-700 border-green-200",
  paused:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  draft:   "bg-gray-100 text-gray-600 border-gray-200",
  deleted: "bg-red-100 text-red-600 border-red-200",
};

const STATUS_LABELS = {
  active:  "Active",
  paused:  "Paused",
  draft:   "Draft",
};

// ─────────────────────────────────────────────
// GigCard — single row / card for a gig
// ─────────────────────────────────────────────
function GigRow({ gig, onDelete, onToggleStatus }) {
  const lowestPrice = gig.packages?.length
    ? Math.min(...gig.packages.map((p) => p.price ?? 0))
    : 0;

  return (
    <Card className="border-border hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-0">
          {/* Cover thumbnail */}
          <div className="w-full sm:w-32 shrink-0">
            {gig.cover_image_url ? (
              <img
                src={gig.cover_image_url}
                alt={gig.title}
                className="w-full sm:w-32 h-24 sm:h-full object-cover rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none"
              />
            ) : (
              <div className="w-full sm:w-32 h-24 sm:h-full min-h-[80px] bg-gradient-to-br from-primary/10 to-accent/30 rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-primary/40" />
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-3 p-4 min-w-0">
            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-foreground truncate max-w-xs">
                  {gig.title}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[gig.status] ?? STATUS_STYLES.draft}`}
                >
                  {STATUS_LABELS[gig.status] ?? gig.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{gig.category}</p>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {gig.rating ? gig.rating.toFixed(1) : "—"}
                  {gig.total_reviews > 0 && (
                    <span className="ml-0.5">({gig.total_reviews})</span>
                  )}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-blue-500" />
                  {gig.total_orders} orders
                </span>
                <span className="text-xs font-semibold text-primary">
                  from ₱{lowestPrice.toLocaleString()}
                </span>
              </div>

              {/* Skills */}
              {gig.skills_required?.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {gig.skills_required.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                  {gig.skills_required.length > 4 && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      +{gig.skills_required.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Quick view on marketplace */}
              <Button size="sm" variant="outline" asChild className="gap-1 text-xs">
                <Link to={`/gigs/${gig.id}`} target="_blank">
                  <ExternalLink className="w-3 h-3" /> View
                </Link>
              </Button>

              {/* Kebab menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link to={`/student/gigs/new?edit=${gig.id}`} className="flex items-center gap-2 cursor-pointer">
                      <Edit className="w-4 h-4" /> Edit Gig
                    </Link>
                  </DropdownMenuItem>

                  {gig.status === "active" ? (
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-yellow-700"
                      onClick={() => onToggleStatus(gig, "paused")}
                    >
                      <Pause className="w-4 h-4" /> Pause Gig
                    </DropdownMenuItem>
                  ) : gig.status === "paused" ? (
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-green-700"
                      onClick={() => onToggleStatus(gig, "active")}
                    >
                      <Play className="w-4 h-4" /> Activate Gig
                    </DropdownMenuItem>
                  ) : null}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => onDelete(gig)}
                  >
                    <Trash2 className="w-4 h-4" /> Delete Gig
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────
function GigRowSkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="p-0">
        <div className="flex gap-0">
          <Skeleton className="w-32 h-24 rounded-l-xl rounded-tr-none" />
          <div className="flex-1 p-4 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-1/4" />
            <div className="flex gap-3 mt-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <PackageOpen className="w-8 h-8 text-primary/50" />
      </div>
      <p className="text-base font-semibold text-foreground">
        {hasFilters ? "No gigs match your filters" : "You haven't created any gigs yet"}
      </p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {hasFilters
          ? "Try adjusting your search or status filter."
          : "Create your first gig and start earning by offering your skills to clients."}
      </p>
      {!hasFilters && (
        <Button className="mt-5 gradient-primary text-white border-0 gap-2" asChild>
          <Link to="/student/gigs/new">
            <Plus className="w-4 h-4" /> Create Your First Gig
          </Link>
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function StudentGigs() {
  const { user } = useCurrentUser();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [gigs,           setGigs]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [gigToDelete,    setGigToDelete]    = useState(null);   // gig object | null
  const [actionLoading,  setActionLoading]  = useState(false);

  // ── Fetch gigs ──────────────────────────────
  const fetchGigs = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { gigs: data, error } = await gigGetMyGigs({ orderBy: "created_at", ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setGigs(data);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchGigs(); }, [fetchGigs]);

  // ── Filtering ────────────────────────────────
  const filtered = gigs.filter((g) => {
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    const matchesSearch =
      !search ||
      g.title?.toLowerCase().includes(search.toLowerCase()) ||
      g.category?.toLowerCase().includes(search.toLowerCase()) ||
      g.skills_required?.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // ── Stats ────────────────────────────────────
  const stats = {
    total:  gigs.length,
    active: gigs.filter((g) => g.status === "active").length,
    paused: gigs.filter((g) => g.status === "paused").length,
    orders: gigs.reduce((sum, g) => sum + (g.total_orders ?? 0), 0),
  };

  // ── Toggle pause / activate ──────────────────
  const handleToggleStatus = async (gig, newStatus) => {
    setActionLoading(true);
    const { error } = await gigSetStatus(gig.id, newStatus);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: newStatus === "active" ? "Gig activated" : "Gig paused",
        description: `"${gig.title}" is now ${newStatus}.`,
      });
      setGigs((prev) =>
        prev.map((g) => (g.id === gig.id ? { ...g, status: newStatus } : g)),
      );
    }
    setActionLoading(false);
  };

  // ── Delete ───────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!gigToDelete) return;
    setActionLoading(true);
    const { error } = await gigDelete(gigToDelete.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Gig deleted", description: `"${gigToDelete.title}" has been removed.` });
      setGigs((prev) => prev.filter((g) => g.id !== gigToDelete.id));
    }
    setGigToDelete(null);
    setActionLoading(false);
  };

  const hasFilters = search !== "" || statusFilter !== "all";

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Gigs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the services you offer to clients
          </p>
        </div>
        <Button className="gradient-primary text-white border-0 gap-2 shrink-0" asChild>
          <Link to="/student/gigs/new">
            <Plus className="w-4 h-4" /> New Gig
          </Link>
        </Button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Gigs",    value: stats.total,  color: "text-foreground",   bg: "bg-muted/50" },
          { label: "Active",        value: stats.active, color: "text-green-600",    bg: "bg-green-50" },
          { label: "Paused",        value: stats.paused, color: "text-yellow-600",   bg: "bg-yellow-50" },
          { label: "Total Orders",  value: stats.orders, color: "text-blue-600",     bg: "bg-blue-50" },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, category or skill…"
            className="pl-9 bg-white text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-white text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Result count ── */}
      {!loading && (
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? "gig" : "gigs"} found
          {hasFilters && (
            <button
              className="ml-2 text-primary hover:underline"
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      {/* ── Gig list ── */}
      <div className="space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => <GigRowSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          filtered.map((gig) => (
            <GigRow
              key={gig.id}
              gig={gig}
              onDelete={setGigToDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))
        )}
      </div>

      {/* ── Delete confirm dialog ── */}
      <AlertDialog
        open={!!gigToDelete}
        onOpenChange={(open) => { if (!open) setGigToDelete(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this gig?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{gigToDelete?.title}"</strong> will be removed from the marketplace.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Deleting…" : "Delete Gig"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
}