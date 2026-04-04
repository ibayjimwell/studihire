import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { base44 } from "@/api/mockBase44Client";
import {
  DollarSign,
  Search,
  Users,
  ShieldCheck,
  Briefcase,
  Flag,
  AlertTriangle,
  Settings,
  FileText,
  LayoutDashboard,
  CheckCircle,
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
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  released: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
  disputed: "bg-orange-100 text-orange-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.entities.Payment.list("-created_date", 200).then(setPayments);
  }, []);

  const filtered = payments.filter((p) => {
    const matchSearch =
      !search ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.payment_method?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const totalRevenue = payments
    .filter((p) => p.status === "released")
    .reduce((s, p) => s + (p.platform_fee || 0), 0);

  const handleRelease = async (payment) => {
    await base44.entities.Payment.update(payment.id, {
      status: "released",
      released_at: new Date().toISOString(),
    });
    setPayments((prev) =>
      prev.map((p) => (p.id === payment.id ? { ...p, status: "released" } : p)),
    );
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" /> Payments
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor all platform transactions
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          Total Platform Revenue (Released)
        </p>
        <p className="text-3xl font-bold text-primary">
          ₱{totalRevenue.toLocaleString()}
        </p>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "paid", "released", "disputed", "refunded"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No payments found.
          </p>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {p.description || "Payment"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Amount: ₱{p.amount?.toLocaleString()} · Fee: ₱
                  {p.platform_fee?.toLocaleString() || 0} · Net: ₱
                  {p.net_amount?.toLocaleString() || 0}
                </p>
                {p.payment_method && (
                  <p className="text-xs text-muted-foreground">
                    Method: {p.payment_method}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[p.status] || "bg-gray-100 text-gray-700"}`}
                >
                  {p.status}
                </span>
                {p.status === "paid" && (
                  <Button
                    size="sm"
                    className="gap-1 text-xs gradient-primary text-white border-0"
                    onClick={() => handleRelease(p)}
                  >
                    <CheckCircle className="w-3 h-3" /> Release
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
