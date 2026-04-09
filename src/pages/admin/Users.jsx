import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { base44 } from "@/api/mockBase44Client";
import {
  Users,
  GraduationCap,
  Briefcase,
  Search,
  LayoutDashboard,
  ShieldCheck,
  DollarSign,
  Flag,
  AlertTriangle,
  Settings,
  FileText,
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

export default function AdminUsers() {
  const [students, setStudents] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.StudentProfile.list("-created_date", 200),
      base44.entities.ClientProfile.list("-created_date", 200),
    ]).then(([s, c]) => {
      setStudents(s);
      setClients(c);
    });
  }, []);

  const filterList = (list) =>
    list.filter(
      (u) =>
        !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()),
    );

  const renderStudents = () => (
    <div className="space-y-3">
      {filterList(students).length === 0 ? (
        <p className="text-center text-muted-foreground py-10">
          No students found.
        </p>
      ) : (
        filterList(students).map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border"
          >
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold">
                {s.full_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{s.full_name}</p>
                <VerificationBadge status={s.verification_status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {s.email} · {s.school_name || "No school"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">{s.course || "—"}</p>
              <p className="text-xs text-muted-foreground">
                Year {s.year_level || "—"}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderClients = () => (
    <div className="space-y-3">
      {filterList(clients).length === 0 ? (
        <p className="text-center text-muted-foreground py-10">
          No clients found.
        </p>
      ) : (
        filterList(clients).map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border"
          >
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-purple-50 text-purple-600 font-semibold">
                {c.full_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{c.full_name}</p>
                <VerificationBadge status={c.verification_status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {c.email} · {c.company_name || "Individual"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground capitalize">
                {c.company_type || "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {c.industry || "—"}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Users
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage all students and clients on the platform
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="students">
        <TabsList className="mb-6 bg-muted">
          <TabsTrigger value="students" className="gap-2">
            <GraduationCap className="w-4 h-4" /> Students (
            {filterList(students).length})
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Briefcase className="w-4 h-4" /> Clients (
            {filterList(clients).length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="students">{renderStudents()}</TabsContent>
        <TabsContent value="clients">{renderClients()}</TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
