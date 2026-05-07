// @ts-nocheck
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { gigGetMyGigs } from "@/api/gigApi";
import { orderGetMyStudentOrders } from "@/api/orderApi";
import { STATUS_DISPLAY_CONFIG } from "@/lib/orderStatusConfig";
import supabase from "@/lib/supabaseClient";
import {
  GraduationCap,
  Briefcase,
  MessageSquare,
  DollarSign,
  Plus,
  Clock,
  LayoutDashboard,
  Package,
  ArrowRight,
  Users,
} from "lucide-react";

const sidebarLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/gigs", label: "My Gigs", icon: Briefcase },
  { href: "/student/my-orders", label: "My Orders", icon: Package },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/student/payments", label: "Earnings", icon: DollarSign },
  { href: "/student/profile", label: "My Profile", icon: GraduationCap },
];

export default function StudentDashboard() {
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      setLoading(true);

      // Fetch profile
      const { data: profData } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Fetch gigs
      const { gigs: gigData } = await gigGetMyGigs({ limit: 5 });

      // Fetch orders
      const { orders: orderData } = await orderGetMyStudentOrders({ limit: 5 });

      setProfile(profData || null);
      setGigs(gigData || []);
      setOrders(orderData || []);
      setLoading(false);
    })();
  }, [user]);

  // ── Computed stats ──────────────────────────────────────────────────

  const activeOrders = orders.filter((o) =>
    ["pending", "in_progress", "revision_requested"].includes(o.status)
  );

  const completedOrders = orders.filter((o) => o.status === "completed");

  const totalEarnings = completedOrders.reduce(
    (sum, o) => sum + Number(o.amount || 0),
    0
  );

  const newOrders = orders.filter(
    (o) => o.status === "awaiting_payment" || o.status === "pending"
  );

  const stats = [
    {
      label: "Active Orders",
      value: activeOrders.length,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "New Orders",
      value: newOrders.length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Active Gigs",
      value: gigs.filter((g) => g.status === "active").length,
      icon: Briefcase,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Earnings",
      value: `₱${totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  // ── Status badge helper ──────────────────────────────────────────────

  const getStatusBadge = (status) => {
    const config = STATUS_DISPLAY_CONFIG[status];
    if (!config) return "bg-gray-100 text-gray-700";
    return config.badge;
  };

  const getStatusLabel = (status) => {
    const config = STATUS_DISPLAY_CONFIG[status];
    return config?.label || status?.replace(/_/g, " ") || "Unknown";
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
      {/* Welcome bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {profile?.full_name?.split(" ")[0] || "Student"} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <VerificationBadge
              status={profile?.verification_status || "pending"}
            />
            {profile?.institution && (
              <span className="text-sm text-muted-foreground">
                {profile.institution}
              </span>
            )}
          </div>
        </div>
        <Button className="gradient-primary text-white border-0 gap-2" asChild>
          <Link to="/student/gigs/new">
            <Plus className="w-4 h-4" /> New Gig
          </Link>
        </Button>
      </div>

      {/* Verification banner */}
      {profile?.verification_status === "pending" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 text-sm">
              Verification in progress
            </p>
            <p className="text-yellow-700 text-xs mt-0.5">
              Our team is reviewing your school ID. You'll be able to post gigs
              once approved.
            </p>
          </div>
        </div>
      )}
      {profile?.verification_status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-red-500 shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-red-800 text-sm">
              Verification rejected
            </p>
            <p className="text-red-700 text-xs mt-0.5">
              {profile.verification_notes || "Please re-upload your school ID."}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 border-red-300 text-red-700"
              asChild
            >
              <Link to="/student/onboarding">Resubmit</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4">
                <div
                  className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}
                >
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Orders Alert */}
      {newOrders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">
              {newOrders.length} new order
              {newOrders.length !== 1 ? "s" : ""} awaiting your review!
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              Review the requirements and start working on these orders.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 border-amber-300 text-amber-800 bg-white hover:bg-amber-50"
              asChild
            >
              <Link to="/student/my-orders">
                Review Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ----- Active Orders ----- */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Active Orders
            </CardTitle>
            <Button size="sm" variant="ghost" className="text-primary" asChild>
              <Link to="/student/my-orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No orders received yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Orders from clients will appear here
                </p>
              </div>
            ) : (
              orders.slice(0, 5).map((o) => (
                <Link
                  key={o.id}
                  to={`/student/orders/${o.id}`}
                  className="block p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {o.gig_title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {o.client_name || "Client"} · {o.package_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {o.due_date
                          ? new Date(o.due_date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">
                        ₱{Number(o.amount).toLocaleString()}
                      </p>
                      <Badge
                        className={`mt-1 text-[10px] px-1.5 py-0 ${getStatusBadge(o.status)}`}
                        variant="secondary"
                      >
                        {getStatusLabel(o.status)}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* ----- My Gigs ----- */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              My Gigs
            </CardTitle>
            <Button size="sm" variant="ghost" className="text-primary" asChild>
              <Link to="/student/gigs">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : gigs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No gigs yet</p>
                {profile?.verification_status === "approved" && (
                  <Button
                    size="sm"
                    className="mt-3 gradient-primary text-white border-0"
                    asChild
                  >
                    <Link to="/student/gigs/new">Create Your First Gig</Link>
                  </Button>
                )}
              </div>
            ) : (
              gigs.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {g.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {g.category}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      g.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {g.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ----- Recent Orders (full width) ----- */}
        {orders.length > 0 && (
          <Card className="border-border lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Recent Orders
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-primary"
                asChild
              >
                <Link to="/student/my-orders">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Gig
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Client
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Package
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Due
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <p className="font-medium text-foreground truncate max-w-[200px]">
                            {o.gig_title}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {o.client_name || "—"}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {o.package_name}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-primary">
                          ₱{Number(o.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge
                            className={`text-[10px] px-2 py-0.5 ${getStatusBadge(o.status)}`}
                            variant="secondary"
                          >
                            {getStatusLabel(o.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground text-xs">
                          {o.due_date
                            ? new Date(o.due_date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}