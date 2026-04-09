import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { base44 } from "@/api/mockBase44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  Package,
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  DollarSign,
  GraduationCap,
  Settings,
  Clock,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

const sidebarLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/gigs", label: "My Gigs", icon: Briefcase },
  { href: "/student/orders", label: "My Orders", icon: Package },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/student/payments", label: "Earnings", icon: DollarSign },
  { href: "/student/profile", label: "My Profile", icon: GraduationCap },
];

const STATUS_CONFIG = {
  awaiting_payment: {
    label: "Awaiting Payment",
    color: "bg-gray-100 text-gray-700",
  },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  revision_requested: {
    label: "Revision",
    color: "bg-orange-100 text-orange-700",
  },
  delivered: { label: "Delivered", color: "bg-purple-100 text-purple-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-700" },
};

export default function StudentMyOrders() {
  const { user } = useCurrentUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    base44.entities.Order.filter(
      { student_id: user.id },
      "-created_date",
      50,
    ).then((o) => {
      setOrders(o);
      setLoading(false);
    });
  }, [user]);

  const filtered = orders.filter(
    (o) => filter === "all" || o.status === filter,
  );
  const activeCount = orders.filter((o) =>
    ["pending", "in_progress", "revision_requested", "delivered"].includes(
      o.status,
    ),
  ).length;

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" /> My Orders
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage all orders from your clients.{" "}
          {activeCount > 0 && (
            <strong className="text-primary">{activeCount} active</strong>
          )}
        </p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          "all",
          "pending",
          "in_progress",
          "revision_requested",
          "delivered",
          "completed",
          "cancelled",
        ].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
            return (
              <div
                key={o.id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {o.gig_title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Client: {o.client_name} · {o.package_name}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Due:{" "}
                    {o.due_date
                      ? format(new Date(o.due_date), "MMM d, yyyy")
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-primary">
                    ₱{o.amount?.toLocaleString()}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/order/${o.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
