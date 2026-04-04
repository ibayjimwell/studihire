import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VerificationBadge from '@/components/shared/VerificationBadge';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import {
  Briefcase, MessageSquare, DollarSign, Users, Plus,
  Clock, LayoutDashboard, FileText, Settings, Search
} from 'lucide-react';

const sidebarLinks = [
  { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/client/projects', label: 'My Projects', icon: Briefcase },
  { href: '/client/applications', label: 'Applications', icon: FileText },
  { href: '/gigs', label: 'Browse Gigs', icon: Search },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/client/payments', label: 'Payments', icon: DollarSign },
  { href: '/client/settings', label: 'Settings', icon: Settings },
];

export default function ClientDashboard() {
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.ClientProfile.filter({ user_id: user?.id }, '-created_date', 1),
      base44.entities.Project.filter({ client_id: user?.id }, '-created_date', 5),
      base44.entities.Payment.filter({ client_id: user?.id }, '-created_date', 5),
    ]).then(([profiles, p, pay]) => {
      setProfile(profiles[0] || null);
      setProjects(p);
      setPayments(pay);
    });
  }, [user]);

  const totalSpent = payments.filter(p => p.status === 'released').reduce((s, p) => s + (p.amount || 0), 0);

  const stats = [
    { label: 'Active Projects', value: projects.filter(p => p.status === 'open').length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Spent', value: `₱${totalSpent.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Applications', value: projects.reduce((s, p) => s + (p.proposals_count || 0), 0), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Client">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Client'} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <VerificationBadge status={profile?.verification_status || 'pending'} />
            {profile?.company_name && <span className="text-sm text-muted-foreground">{profile.company_name}</span>}
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2" asChild>
          <Link to="/client/projects/new"><Plus className="w-4 h-4" /> Post a Project</Link>
        </Button>
      </div>

      {profile?.verification_status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 text-sm">Verification in progress</p>
            <p className="text-yellow-700 text-xs mt-0.5">Our team is reviewing your valid ID. You'll be able to post projects once approved.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">My Projects</CardTitle>
            <Button size="sm" variant="ghost" className="text-primary" asChild>
              <Link to="/client/projects">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No projects yet</p>
                {profile?.verification_status === 'approved' && (
                  <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white border-0" asChild>
                    <Link to="/client/projects/new">Post Your First Project</Link>
                  </Button>
                )}
              </div>
            ) : projects.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.proposals_count || 0} proposals</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>{p.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Payments</CardTitle>
            <Button size="sm" variant="ghost" className="text-primary" asChild>
              <Link to="/client/payments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No payments yet</p>
              </div>
            ) : payments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{p.description || 'Payment'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.created_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">₱{p.amount?.toLocaleString()}</p>
                  <span className={`text-xs ${p.status === 'released' ? 'text-green-600' : 'text-yellow-600'}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}