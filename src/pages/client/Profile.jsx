// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { useToast } from "@/components/ui/use-toast";
import {
  clientProfileGetMine,
  clientProfileGetMySubmission,
  clientProfileGetAdminReview,
  clientProfileUpdateEditable,
  clientProfileUploadAvatar,
} from "@/api/clientProfileApi";
import {
  Briefcase,
  MessageSquare,
  DollarSign,
  Users,
  Plus,
  Clock,
  LayoutDashboard,
  FileText,
  Settings,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
} from "lucide-react";

const sidebarLinks = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/projects", label: "My Projects", icon: Briefcase },
  { href: "/client/applications", label: "Applications", icon: FileText },
  { href: "/gigs", label: "Browse Gigs", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/client/payments", label: "Payments", icon: DollarSign },
  { href: "/client/profile", label: "My Profile", icon: Settings },
];

const BANNER = {
  pending: {
    bg: "bg-muted/60 border-border", Icon: ClockIcon, iconCls: "text-muted-foreground",
    title: "Profile not yet submitted", bodyFn: () => "Complete your onboarding to submit your details for admin verification.",
    cta: { label: "Complete Onboarding", href: "/client/onboarding" },
  },
  submitted: {
    bg: "bg-blue-50 border-blue-200", Icon: ClockIcon, iconCls: "text-blue-600",
    title: "Verification under review", bodyFn: () => "Your submission is in our admin queue. This usually takes 1–2 business days.",
    cta: null,
  },
  approved: {
    bg: "bg-green-50 border-green-200", Icon: CheckCircle, iconCls: "text-green-600",
    title: "Account verified ✓", bodyFn: () => "Your client account is verified. You can now post projects.",
    cta: null,
  },
  rejected: {
    bg: "bg-red-50 border-red-200", Icon: XCircle, iconCls: "text-red-600",
    title: "Verification rejected", bodyFn: (reason, comments) => reason || comments || "Your submission was rejected. Please review the notes and resubmit.",
    cta: { label: "Resubmit", href: "/client/onboarding" },
  },
  needs_revision: {
    bg: "bg-orange-50 border-orange-200", Icon: RefreshCw, iconCls: "text-orange-600",
    title: "Revision required", bodyFn: (reason, comments) => comments || reason || "An admin requested changes. Please review and resubmit.",
    cta: { label: "Resubmit", href: "/client/onboarding" },
  },
};

function VerificationBanner({ status, review }) {
  const cfg = BANNER[status] ?? BANNER.pending;
  const { Icon } = cfg;
  const reason = review?.rejection_reason ?? "";
  const comments = review?.comments ?? "";
  const body = cfg.bodyFn(reason, comments);
  const titleCls = cfg.iconCls.replace("-600", "-800");
  return (
    <div className={`border rounded-xl p-4 flex items-start gap-3 ${cfg.bg}`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconCls}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${titleCls}`}>{cfg.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
        {cfg.cta && <Button size="sm" variant="outline" className="mt-2 text-xs h-7" asChild><Link to={cfg.cta.href}>{cfg.cta.label}</Link></Button>}
      </div>
    </div>
  );
}

function EditableCard({ title, editing, onEdit, onSave, onCancel, saving, view, form }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {!editing ? (
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onEdit}><Edit3 className="w-3 h-3" /> Edit</Button>
        ) : (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel} disabled={saving}><X className="w-3 h-3 mr-1" /> Cancel</Button>
            <Button size="sm" className="h-7 text-xs gradient-primary text-white border-0 gap-1" onClick={onSave} disabled={saving}>
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>{editing ? form : view}</CardContent>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Card className="border-border overflow-hidden"><Skeleton className="h-28 w-full rounded-none" />
        <CardContent className="px-6 pb-6 pt-4 flex gap-4">
          <Skeleton className="w-20 h-20 rounded-full -mt-10" />
          <div className="flex-1 space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-64" /></div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Skeleton className="h-36 rounded-xl" /><Skeleton className="h-36 rounded-xl" /></div>
    </div>
  );
}

export default function ClientProfile() {
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const [profile, setProfile] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingBio, setEditingBio] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ profile: p }, { submission: s }] = await Promise.all([
      clientProfileGetMine(),
      clientProfileGetMySubmission(),
    ]);
    setProfile(p);
    setSubmission(s);
    if (s?.id && s.submission_status !== "draft") {
      const { review: r } = await clientProfileGetAdminReview(s.id);
      setReview(r);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const verStatus = review?.review_status ?? profile?.verification_status ?? (submission ? "submitted" : "pending");

  const startEditBio = () => { setBioDraft(profile?.bio ?? ""); setEditingBio(true); };
  const startEditContact = () => {
    setPhoneDraft(profile?.phone_number ?? "");
    setLocationDraft(profile?.location ?? "");
    setEditingContact(true);
  };

  const saveBio = async () => {
    setSavingBio(true);
    const { profile: updated, error } = await clientProfileUpdateEditable({ bio: bioDraft });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setProfile(p => ({ ...p, bio: updated.bio })); setEditingBio(false); toast({ title: "Bio updated" }); }
    setSavingBio(false);
  };

  const saveContact = async () => {
    setSavingContact(true);
    const { profile: updated, error } = await clientProfileUpdateEditable({ phone_number: phoneDraft, location: locationDraft });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setProfile(p => ({ ...p, phone_number: updated.phone_number, location: updated.location })); setEditingContact(false); toast({ title: "Contact updated" }); }
    setSavingContact(false);
  };

  if (loading) return <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Client"><ProfileSkeleton /></DashboardLayout>;
  if (!profile && !submission) return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Client">
      <div className="text-center py-20">
        <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-semibold">No profile found</p>
        <Button className="mt-4 gradient-primary text-white border-0" asChild><Link to="/client/onboarding">Complete Onboarding</Link></Button>
      </div>
    </DashboardLayout>
  );

  const name = profile?.full_name ?? submission?.full_name ?? "Client";
  const email = profile?.email ?? submission?.email ?? user?.email ?? "";
  const phone = profile?.phone_number ?? "";
  const location = profile?.location ?? "";
  const bio = profile?.bio ?? "";
  const avatarUrl = profile?.profile_image_url ?? null;
  const companyName = profile?.company_name ?? submission?.company_name ?? "—";
  const companyType = profile?.company_type ?? submission?.company_type ?? "—";
  const industry = profile?.industry ?? submission?.industry ?? "—";
  const website = profile?.website ?? submission?.website ?? "";

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Client">
      <div className="max-w-4xl mx-auto space-y-5">
        <VerificationBanner status={verStatus} review={review} />

        {/* Hero Card */}
        <Card className="border-border overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/30" />
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              <Avatar className="w-20 h-20 border-4 border-white shadow-md shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">{name?.[0] ?? "C"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold">{name}</h1>
                  <VerificationBadge status={verStatus} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{companyName !== "—" ? `${companyName} · ${industry}` : industry}</p>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {email}</span>
                  {phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {phone}</span>}
                  {location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {location}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Read‑only Business Info */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" /> Business Information
              <span className="ml-auto text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Locked · From onboarding</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Company</p><p className="font-medium">{companyName}</p></div>
              <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium capitalize">{companyType}</p></div>
              <div><p className="text-xs text-muted-foreground">Industry</p><p className="font-medium">{industry}</p></div>
              {website && <div className="col-span-full"><p className="text-xs text-muted-foreground">Website</p><a href={website} className="text-primary text-sm underline">{website}</a></div>}
            </div>
          </CardContent>
        </Card>

        {/* Editable Bio */}
        <EditableCard
          title="About"
          editing={editingBio} onEdit={startEditBio} onSave={saveBio} onCancel={() => setEditingBio(false)} saving={savingBio}
          view={bio ? <p className="text-sm leading-relaxed">{bio}</p> : <p className="text-sm italic text-muted-foreground">No description yet — click Edit</p>}
          form={<Textarea rows={4} value={bioDraft} onChange={e => setBioDraft(e.target.value)} />}
        />

        {/* Editable Contact */}
        <EditableCard
          title="Contact Info"
          editing={editingContact} onEdit={startEditContact} onSave={saveContact} onCancel={() => setEditingContact(false)} saving={savingContact}
          view={<div className="space-y-2 text-sm">{phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> {phone}</p>}{location && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {location}</p>}{!phone && !location && <p className="italic text-muted-foreground">No contact info</p>}</div>}
          form={<div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label className="text-xs">Phone</Label><Input value={phoneDraft} onChange={e => setPhoneDraft(e.target.value)} /></div><div><Label className="text-xs">Location</Label><Input value={locationDraft} onChange={e => setLocationDraft(e.target.value)} /></div></div>}
        />
      </div>
    </DashboardLayout>
  );
}