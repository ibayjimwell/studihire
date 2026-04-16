import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  Package,
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  DollarSign,
  Search,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { STATUS_DISPLAY_CONFIG } from "@/lib/orderStatusConfig";

const sidebarLinks = [
  { href: "/client/projects", label: "My Projects", icon: Briefcase },
  { href: "/client/orders", label: "My Orders", icon: Package },
  { href: "/client/applicants", label: "Applicants", icon: Briefcase },
  { href: "/gigs", label: "Browse Gigs", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/client/payments", label: "Payments", icon: DollarSign },
];

// Map shared config to local format
const STATUS_CONFIG = Object.entries(STATUS_DISPLAY_CONFIG).reduce(
  (acc, [key, config]) => {
    acc[key] = {
      label: config.label,
      color: config.badge,
    };
    return acc;
  },
  {},
);

export default function ClientMyOrders() {
  const { user } = useCurrentUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Simulate loading orders with dummy data
    const dummyOrders = [
      {
        id: "order-1",
        gig_id: "gig-001",
        gig_title: "Professional Logo Design",
        client_id: "client-001",
        student_id: "student-001",
        student_name: "Maria Garcia",
        package_name: "Standard",
        amount: 3000,
        delivery_days: 5,
        status: "awaiting_payment",
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_date: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "order-2",
        gig_id: "gig-002",
        gig_title: "Website Banner Design",
        client_id: "client-001",
        student_id: "student-002",
        student_name: "John Smith",
        package_name: "Premium",
        amount: 5000,
        delivery_days: 7,
        status: "in_progress",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "order-3",
        gig_id: "gig-003",
        gig_title: "Business Card Design",
        client_id: "client-001",
        student_id: "student-003",
        student_name: "Sarah Lee",
        package_name: "Basic",
        amount: 1500,
        delivery_days: 3,
        status: "delivered",
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_date: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "order-4",
        gig_id: "gig-004",
        gig_title: "Social Media Graphics",
        client_id: "client-001",
        student_id: "student-001",
        student_name: "Maria Garcia",
        package_name: "Standard",
        amount: 3000,
        delivery_days: 5,
        status: "completed",
        due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_date: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: "order-5",
        gig_id: "gig-005",
        gig_title: "Flyer Design",
        client_id: "client-001",
        student_id: "student-002",
        student_name: "John Smith",
        package_name: "Premium",
        amount: 4500,
        delivery_days: 4,
        status: "revision_requested",
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_date: new Date(Date.now() - 345600000).toISOString(),
      },
      {
        id: "order-6",
        gig_id: "gig-001",
        gig_title: "Professional Logo Design",
        client_id: "client-001",
        student_id: "student-003",
        student_name: "Sarah Lee",
        package_name: "Basic",
        amount: 1500,
        delivery_days: 3,
        status: "pending",
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_date: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    setOrders(dummyOrders);
    setLoading(false);
  }, []);

  const filtered = orders.filter(
    (o) => filter === "all" || o.status === filter,
  );
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Client">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" /> My Orders
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track all your gig orders.{" "}
          {deliveredCount > 0 && (
            <strong className="text-purple-600">
              {deliveredCount} awaiting your review!
            </strong>
          )}
        </p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          "all",
          "pending",
          "in_progress",
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
          <Button className="mt-4 gradient-primary text-white border-0" asChild>
            <Link to="/gigs">Browse Gigs</Link>
          </Button>
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
                    Freelancer: {o.student_name} · {o.package_name}
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
