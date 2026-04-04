import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { base44 } from "@/api/mockBase44Client";
import {
  Users,
  Briefcase,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  Flag,
  BarChart3,
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

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [clients, setClients] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reports, setReports] = useState([]);
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.StudentProfile.list("-created_date", 100),
      base44.entities.ClientProfile.list("-created_date", 100),
      base44.entities.Gig.list("-created_date", 50),
      base44.entities.Payment.list("-created_date", 50),
      base44.entities.Report.filter({ status: "open" }, "-created_date", 20),
      base44.entities.Dispute.filter({ status: "open" }, "-created_date", 20),
    ]).then(([s, c, g, p, r, d]) => {
      setStudents(s);
      setClients(c);
      setGigs(g);
      setPayments(p);
      setReports(r);
      setDisputes(d);
    });
  }, []);

  const pendingStudents = students.filter(
    (s) => s.verification_status === "pending",
  ).length;
  const pendingClients = clients.filter(
    (c) => c.verification_status === "pending",
  ).length;
  const totalRevenue = payments
    .filter((p) => p.status === "released")
    .reduce((s, p) => s + (p.platform_fee || 0), 0);

  const stats = [
    {
      label: "Total Students",
      value: students.length,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      sub: `${pendingStudents} pending`,
    },
    {
      label: "Total Clients",
      value: clients.length,
      icon: Briefcase,
      color: "text-purple-600",
      bg: "bg-purple-50",
      sub: `${pendingClients} pending`,
    },
    {
      label: "Active Gigs",
      value: gigs.filter((g) => g.status === "active").length,
      icon: ShieldCheck,
      color: "text-green-600",
      bg: "bg-green-50",
      sub: "live marketplace",
    },
    {
      label: "Platform Revenue",
      value: `₱${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-50",
      sub: "total earned",
    },
    {
      label: "Open Reports",
      value: reports.length,
      icon: Flag,
      color: "text-red-600",
      bg: "bg-red-50",
      sub: "need review",
    },
    {
      label: "Open Disputes",
      value: disputes.length,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      sub: "need resolution",
    },
  ];

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Platform overview and management
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {s.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {s.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.sub}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending verifications */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Pending Verifications
            </CardTitle>
            <Button size="sm" variant="ghost" className="text-primary" asChild>
              <Link to="/admin/verifications">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingStudents + pendingClients === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  All verifications up to date!
                </p>
              </div>
            ) : (
              <>
                {students
                  .filter((s) => s.verification_status === "pending")
                  .slice(0, 3)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                    >
                      <div>
                        <p className="text-sm font-medium">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Student • {s.school_name || "Unknown school"}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          to={`/admin/verifications?id=${s.id}&type=student`}
                        >
                          Review
                        </Link>
                      </Button>
                    </div>
                  ))}
                {clients
                  .filter((c) => c.verification_status === "pending")
                  .slice(0, 2)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                    >
                      <div>
                        <p className="text-sm font-medium">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Client • {c.company_name || "Individual"}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          to={`/admin/verifications?id=${c.id}&type=client`}
                        >
                          Review
                        </Link>
                      </Button>
                    </div>
                  ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent reports */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" />
              Open Reports & Disputes
            </CardTitle>
            <Button size="sm" variant="ghost" className="text-primary" asChild>
              <Link to="/admin/reports">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.length + disputes.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No open reports!
                </p>
              </div>
            ) : (
              <>
                {reports.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        Report: {r.reason?.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Content: {r.content_type}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-700"
                      asChild
                    >
                      <Link to="/admin/reports">Review</Link>
                    </Button>
                  </div>
                ))}
                {disputes.slice(0, 2).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                  >
                    <div>
                      <p className="text-sm font-medium">Dispute</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {d.reason}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-200 text-orange-700"
                      asChild
                    >
                      <Link to="/admin/disputes">Review</Link>
                    </Button>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
