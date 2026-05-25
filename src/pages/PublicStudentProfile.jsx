// @ts-nocheck
/**
 * PublicStudentProfile — /student/:id
 *
 * Public-facing student profile viewable by anyone.
 * Shows student info, academic background, gigs, credentials, and reviews.
 * No editing capabilities — this is a read-only portfolio-style page.
 */

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/shared/StarRating";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { chatStartConversation } from "@/api/chatApi";
import {
  publicProfileGetStudent,
  publicProfileGetSubmission,
  publicProfileGetGigs,
  publicProfileGetCredentials,
  publicProfileGetReviews,
} from "@/api/publicProfileApi";
import {
  GraduationCap,
  Briefcase,
  Star,
  MapPin,
  Mail,
  BookOpen,
  Award,
  MessageSquare,
  Shield,
  ShieldCheck,
  FileText,
  ExternalLink,
  Calendar,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
      <Skeleton className="h-6 w-32" />
      <Card className="border-border overflow-hidden">
        <Skeleton className="h-28 w-full rounded-none" />
        <CardContent className="px-6 pb-6 pt-4 flex gap-4">
          <Skeleton className="w-20 h-20 rounded-full -mt-10 shrink-0" />
          <div className="flex-1 space-y-2 pt-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Credential card
// ─────────────────────────────────────────────
function CredentialCard({ credential }) {
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 50) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 20) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-500 bg-gray-50 border-gray-200";
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "certificate": return <Award className="w-4 h-4 text-primary" />;
      case "award":       return <Shield className="w-4 h-4 text-yellow-500" />;
      case "badge":       return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      case "license":     return <FileText className="w-4 h-4 text-green-500" />;
      default:            return <Award className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-white border border-border rounded-xl hover:shadow-sm transition-shadow">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {getCategoryIcon(credential.category)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{credential.title}</p>
          {credential.is_verified && (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0 h-4">
              Verified ✓
            </Badge>
          )}
        </div>
        {credential.issuer && (
          <p className="text-xs text-muted-foreground">{credential.issuer}</p>
        )}
        {credential.description && (
          <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{credential.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getScoreColor(credential.validity_score)}`}
          >
            Score: {credential.validity_score}
          </span>
          {credential.file_url && (
            <a
              href={credential.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              <ExternalLink className="w-2.5 h-2.5" /> View File
            </a>
          )}
          <span className="text-[10px] text-muted-foreground capitalize">{credential.category}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function PublicStudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [profile, setProfile] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, average: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    setNotFound(false);

    const { profile: p, error: pErr } = await publicProfileGetStudent(id);

    if (pErr || !p) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(p);

    const [
      { submission: s },
      { gigs: g },
      { credentials: c },
      { reviews: r, stats: rs },
    ] = await Promise.all([
      publicProfileGetSubmission(id),
      publicProfileGetGigs(id),
      publicProfileGetCredentials(id),
      publicProfileGetReviews(id),
    ]);

    setSubmission(s);
    setGigs(g);
    setCredentials(c);
    setReviews(r);
    setReviewStats(rs);
    setLoading(false);
  };

  const handleContact = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    setContacting(true);
    try {
      await chatStartConversation({
        otherUserId: id,
        otherName: profile?.full_name || "Student",
        otherRole: "student",
      });
      navigate("/messages");
    } catch {
      navigate("/messages");
    }
    setContacting(false);
  };

  const institution = submission?.institution || profile?.school_name || "";
  const fieldOfStudy = submission?.field_of_study || profile?.course || "";
  const skills = Array.isArray(submission?.skills)
    ? submission.skills
    : Array.isArray(profile?.skills)
      ? profile.skills
      : [];

  // ── States ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <ProfileSkeleton />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-center px-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-lg font-semibold text-foreground">Student not found</p>
          <p className="text-muted-foreground text-sm">
            This student profile may not exist or has been removed.
          </p>
          <Button variant="outline" className="mt-2" onClick={() => navigate("/gigs")}>
            Browse Gigs
          </Button>
        </div>
      </div>
    );
  }

  const name = profile?.full_name || "Student";
  const email = profile?.email || "";
  const location = profile?.location || "";
  const bio = profile?.bio || "";
  const avatarUrl = profile?.profile_image_url || null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          to="/gigs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Gigs
        </Link>

        {/* ── Hero card ── */}
        <Card className="border-border overflow-hidden mb-6">
          <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/30" />
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              <Avatar className="w-20 h-20 border-4 border-white shadow-md shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {name?.[0] ?? "S"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{name}</h1>
                  <VerificationBadge status={profile?.verification_status} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {fieldOfStudy ? `${fieldOfStudy} · ` : ""}
                  {institution || "Student"}
                </p>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                  {email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {email}
                    </span>
                  )}
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {gigs.length} active gigs
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-5 sm:pb-1 shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">
                    {reviewStats.average > 0 ? reviewStats.average.toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-center">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Rating
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{reviewStats.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {reviewStats.total === 1 ? "Review" : "Reviews"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{credentials.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {credentials.length === 1 ? "Credential" : "Credentials"}
                  </p>
                </div>
              </div>
            </div>

            {/* Message button */}
            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleContact}
                disabled={contacting}
                size="sm"
              >
                <MessageSquare className="w-4 h-4" />
                {user ? "Message Student" : "Log in to Contact"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Bio + Academic + Credentials */}
          <div className="lg:col-span-2 space-y-5">
            {/* Bio section */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" /> About
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bio ? (
                  <p className="text-sm text-foreground/80 leading-relaxed">{bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No bio provided.</p>
                )}
              </CardContent>
            </Card>

            {/* Academic info */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" /> Academic Background
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {[
                    { label: "Institution", value: institution || "—" },
                    { label: "Field of Study", value: fieldOfStudy || "—" },
                    { label: "Grad. Year", value: submission?.graduation_year || "—" },
                    { label: "Education Level", value: submission?.education_level || "—" },
                    { label: "Exp. Years", value: submission?.years_of_experience != null ? `${submission.years_of_experience} yr${submission.years_of_experience !== 1 ? "s" : ""}` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium text-foreground mt-0.5">{String(value)}</p>
                    </div>
                  ))}
                </div>
                {skills.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Credentials */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Credentials
                  {credentials.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {credentials.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {credentials.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    No credentials listed.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {credentials.map((cred) => (
                      <CredentialCard key={cred.id} credential={cred} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar: Gigs + Reviews */}
          <div className="space-y-5">
            {/* Gigs */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Active Gigs
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                    {gigs.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gigs.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    No active gigs yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {gigs.slice(0, 5).map((gig) => (
                      <Link
                        key={gig.id}
                        to={`/gigs/${gig.id}`}
                        className="block p-3 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
                      >
                        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                          {gig.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span>{gig.avg_rating?.toFixed(1) || gig.rating?.toFixed(1) || "—"}</span>
                          <span>·</span>
                          <span>₱{(gig.packages?.[0]?.price || 0).toLocaleString()}+</span>
                        </div>
                      </Link>
                    ))}
                    {gigs.length > 5 && (
                      <Link
                        to={`/gigs?student=${id}`}
                        className="block text-center text-xs text-primary hover:underline pt-1"
                      >
                        View all {gigs.length} gigs
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews summary */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewStats.total === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    No reviews yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Rating distribution */}
                    <div className="space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewStats.distribution?.[star] || 0;
                        const pct = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-8 text-muted-foreground">{star} ★</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-6 text-right text-muted-foreground">{count}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Recent reviews */}
                    <div className="border-t border-border pt-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Recent</p>
                      {reviews.slice(0, 3).map((r) => (
                        <div key={r.id} className="text-xs text-foreground/70">
                          <span className="flex items-center gap-1">
                            <StarRating rating={r.rating} size="xs" showValue={false} />
                            <span className="text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </span>
                          {r.comment && (
                            <p className="line-clamp-2 mt-0.5 text-muted-foreground">{r.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}