import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { base44 } from "@/api/mockBase44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  GraduationCap,
  Briefcase,
  MessageSquare,
  DollarSign,
  Star,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  LayoutDashboard,
  FileText,
  Settings,
  Bell,
} from "lucide-react";

const sidebarLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/gigs", label: "My Gigs", icon: Briefcase },
  { href: "/student/applications", label: "Applications", icon: FileText },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/student/payments", label: "Earnings", icon: DollarSign },
  { href: "/student/profile", label: "My Profile", icon: GraduationCap },
  { href: "/student/settings", label: "Settings", icon: Settings },
];

export default function StudentDashboard() {
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.StudentProfile.filter(
        { user_id: user?.id },
        "-created_date",
        1,
      ),
      base44.entities.Gig.list("-created_date", 5),
      base44.entities.Payment.filter(
        { student_id: user?.id },
        "-created_date",
        5,
      ),
    ]).then(([profiles, g, p]) => {
      setProfile(profiles[0] || null);
      setGigs(g);
      setPayments(p);
      setLoading(false);
    });
  }, [user]);

  const totalEarnings = payments
    .filter((p) => p.status === "released")
    .reduce((s, p) => s + (p.net_amount || 0), 0);
  const pendingEarnings = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + (p.net_amount || 0), 0);

  const stats = [
    {
      label: "Total Earned",
      value: `₱${totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pending",
      value: `₱${pendingEarnings.toLocaleString()}`,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Active Gigs",
      value: gigs.filter((g) => g.status === "active").length,
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Rating",
      value: profile?.rating ? `${profile.rating.toFixed(1)}★` : "—",
      icon: Star,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
      {/* Welcome bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Student"} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <VerificationBadge
              status={profile?.verification_status || "pending"}
            />
            {profile?.school_name && (
              <span className="text-sm text-muted-foreground">
                {profile.school_name}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Gigs */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">My Gigs</CardTitle>
            <Button size="sm" variant="ghost" className="text-primary" asChild>
              <Link to="/student/gigs">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {gigs.length === 0 ? (
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
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
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
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
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

        {/* Recent Payments */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Earnings</CardTitle>
            <Button size="sm" variant="ghost" className="text-primary" asChild>
              <Link to="/student/payments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No transactions yet
                </p>
              </div>
            ) : (
              payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {p.description || "Payment"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      ₱{p.net_amount?.toLocaleString()}
                    </p>
                    <span
                      className={`text-xs ${p.status === "released" ? "text-green-600" : "text-yellow-600"}`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
