import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { base44 } from "@/api/mockBase44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerificationBadge from "@/components/shared/VerificationBadge";
import ProfileAvatarUpload from "@/components/student/ProfileAvatarUpload";
import StudentGigsTab from "@/components/student/StudentGigsTab";
import StudentPortfolioTab from "@/components/student/StudentPortfolioTab";
import {
  GraduationCap,
  Briefcase,
  Star,
  MapPin,
  Mail,
  Phone,
  Link2,
  BookOpen,
  Award,
  LayoutDashboard,
  FileText,
  MessageSquare,
  DollarSign,
  Settings,
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

export default function StudentProfile() {
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    base44.entities.StudentProfile.filter(
      { user_id: user.id },
      "-created_date",
      1,
    ).then((profiles) => {
      setProfile(profiles[0] || null);
      setLoading(false);
    });
  }, [user]);

  const handleAvatarUpdate = (newAvatarUrl) => {
    setProfile((p) => ({ ...p, avatar_url: newAvatarUrl }));
  };

  if (loading) {
    return (
      <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
        <div className="text-center py-20">
          <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No profile found.</p>
          <Button className="mt-4 gradient-primary text-white border-0" asChild>
            <Link to="/student/onboarding">Complete Onboarding</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Hero Card */}
        <Card className="border-border overflow-hidden">
          {/* Cover banner */}
          <div className="h-28 gradient-hero" />

          <CardContent className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              {/* Avatar with upload */}
              <ProfileAvatarUpload
                profile={profile}
                onAvatarUpdate={handleAvatarUpdate}
              />

              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">
                    {profile.full_name}
                  </h1>
                  <VerificationBadge status={profile.verification_status} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {profile.course} · {profile.school_name}
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  {profile.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.address}
                    </span>
                  )}
                  {profile.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {profile.email}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {profile.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 sm:pb-1 shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">
                    {profile.rating?.toFixed(1) || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    Rating
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">
                    {profile.total_reviews || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">
                    ₱{(profile.total_earnings || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Earned</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 text-sm text-foreground/80 leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}

            {/* Portfolio links */}
            {profile.portfolio_links?.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {profile.portfolio_links.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Link2 className="w-3 h-3" />{" "}
                    {link.replace(/^https?:\/\//, "").split("/")[0]}
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Education */}
          {profile.education?.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" /> Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.education.map((edu, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium text-foreground">{edu.degree}</p>
                    <p className="text-muted-foreground text-xs">
                      {edu.institution} · {edu.year}
                    </p>
                  </div>
                ))}
                {/* Current school */}
                {profile.school_name && (
                  <div className="text-sm pt-1 border-t border-border">
                    <p className="font-medium text-foreground">
                      {profile.course}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {profile.school_name} · {profile.year_level} · Est.{" "}
                      {profile.graduation_year}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Work Experience */}
          {profile.work_experience?.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.work_experience.map((exp, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium text-foreground">{exp.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {exp.company} · {exp.duration}
                    </p>
                    {exp.description && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Gigs & Portfolio Tabs */}
        <Tabs defaultValue="gigs">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="gigs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> My Gigs
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Portfolio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gigs" className="mt-4">
            <StudentGigsTab
              studentId={profile.id}
              verificationStatus={profile.verification_status}
            />
          </TabsContent>

          <TabsContent value="portfolio" className="mt-4">
            <StudentPortfolioTab profileId={profile.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
