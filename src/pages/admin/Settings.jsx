import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Settings, Users, ShieldCheck, DollarSign,
  Flag, AlertTriangle, Briefcase, FileText, LayoutDashboard, Save
} from 'lucide-react';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/gigs', label: 'Gigs', icon: Briefcase },
  { href: '/admin/projects', label: 'Projects', icon: FileText },
  { href: '/admin/payments', label: 'Payments', icon: DollarSign },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSettings() {
  const [platformFee, setPlatformFee] = useState('10');
  const [minPayout, setMinPayout] = useState('500');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure platform-wide settings</p>
      </div>

      <div className="space-y-6 max-w-xl">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Payment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Platform Fee (%)</label>
              <Input type="number" value={platformFee} onChange={e => setPlatformFee(e.target.value)} placeholder="e.g. 10" />
              <p className="text-xs text-muted-foreground mt-1">Percentage taken from each completed payment.</p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Minimum Payout (₱)</label>
              <Input type="number" value={minPayout} onChange={e => setMinPayout(e.target.value)} placeholder="e.g. 500" />
              <p className="text-xs text-muted-foreground mt-1">Minimum balance required before a student can withdraw.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Verification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Auto-approve Verified Schools</label>
              <p className="text-xs text-muted-foreground">Coming soon — allow trusted institutions to be auto-approved.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="w-4 h-4 text-primary" /> Moderation Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Configure auto-flagging rules, spam filters, and moderation thresholds. (Coming soon)</p>
          </CardContent>
        </Card>

        <Button className="gradient-primary text-white border-0 gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>
    </DashboardLayout>
  );
}