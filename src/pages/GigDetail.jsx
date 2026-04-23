import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import StarRating from "@/components/shared/StarRating";
import VerificationBadge from "@/components/shared/VerificationBadge";
import {
  gigGetById,
  gigGetStudentProfile,
  gigGetReviews,
} from "@/api/gigApi";
import {
  Clock,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
        <div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Package selector tab strip
// ---------------------------------------------------------------------------
function PackageTabs({ packages, selected, onSelect }) {
  if (!packages || packages.length <= 1) return null;
  return (
    <div className="flex rounded-xl overflow-hidden border border-border">
      {packages.map((p, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            selected === i
              ? "bg-primary text-primary-foreground"
              : "bg-white text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order / contact sidebar card
// ---------------------------------------------------------------------------
function OrderCard({ pkg, onOrder, onContact }) {
  if (!pkg) return null;
  return (
    <Card className="border-border shadow-lg sticky top-4">
      <CardContent className="p-5 space-y-4">
        {/* Package name + price */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">{pkg.name}</span>
          <span className="text-2xl font-bold text-primary">
            ₱{pkg.price?.toLocaleString()}
          </span>
        </div>

        {/* Package description */}
        {pkg.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {pkg.description}
          </p>
        )}

        {/* Delivery + revisions */}
        <div className="flex gap-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 shrink-0" />
            {pkg.delivery_days} day{pkg.delivery_days !== 1 ? "s" : ""} delivery
          </span>
          <span className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 shrink-0" />
            {pkg.revisions} revision{pkg.revisions !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Feature list */}
        {pkg.features?.length > 0 && (
          <ul className="space-y-1.5">
            {pkg.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        <Button
          className="w-full gradient-primary text-white border-0 h-11 gap-2"
          onClick={onOrder}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onContact}
        >
          <MessageSquare className="w-4 h-4" /> Contact Student
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function GigDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [gig,        setGig]        = useState(null);
  const [student,    setStudent]    = useState(null);
  const [reviews,    setReviews]    = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  // ── Load all data in parallel ─────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);

    Promise.all([
      gigGetById(id),
      gigGetReviews(id),
    ]).then(async ([{ gig: g, error: gigErr }, { reviews: revs }]) => {
      if (gigErr || !g) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setGig(g);
      setReviews(revs);

      // Load student profile independently — a missing profile shouldn't
      // block the gig from rendering.
      if (g.student_id) {
        const { profile } = await gigGetStudentProfile(g.student_id);
        setStudent(profile ?? null);
      }

      setLoading(false);
    });
  }, [id]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleOrder   = () => navigate(`/checkout?gig_id=${id}&pkg=${selectedPkg}`);
  const handleContact = () => navigate("/messages");

  const pkg = gig?.packages?.[selectedPkg];

  // ── States ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <DetailSkeleton />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-center px-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-lg font-semibold text-foreground">Gig not found</p>
          <p className="text-muted-foreground text-sm">
            This gig may have been removed or is no longer available.
          </p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => navigate("/gigs")}
          >
            Browse Gigs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title + meta */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-secondary text-secondary-foreground">
                  {gig.category}
                </Badge>
                {gig.subcategory && (
                  <Badge variant="outline">{gig.subcategory}</Badge>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                {gig.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <StarRating rating={gig.rating || 0} size="md" />
                <span className="text-sm text-muted-foreground">
                  ({gig.total_reviews || 0} {gig.total_reviews === 1 ? "review" : "reviews"})
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">
                  {gig.total_orders || 0} {gig.total_orders === 1 ? "order" : "orders"}
                </span>
              </div>
            </div>

            {/* Cover image */}
            {gig.cover_image_url && (
              <div className="rounded-2xl overflow-hidden aspect-video border border-border">
                <img
                  src={gig.cover_image_url}
                  alt={gig.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Student profile card */}
            {student && (
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-border">
                <Avatar className="w-14 h-14 shrink-0">
                  <AvatarImage src={student.avatar_url} alt={student.full_name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                    {student.full_name?.[0] ?? <GraduationCap className="w-6 h-6" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground">{student.full_name}</h3>
                    <VerificationBadge status={student.verification_status} />
                  </div>
                  {(student.course || student.school_name) && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {[student.course, student.school_name].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {student.bio && (
                    <p className="text-sm text-foreground/80 mt-2 line-clamp-2">
                      {student.bio}
                    </p>
                  )}
                  {student.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {student.skills.slice(0, 5).map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-md"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabs: Description / Reviews / FAQ */}
            <Tabs defaultValue="description">
              <TabsList className="bg-muted">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="reviews">
                  Reviews ({reviews.length})
                </TabsTrigger>
                {gig.faq?.length > 0 && (
                  <TabsTrigger value="faq">FAQ</TabsTrigger>
                )}
              </TabsList>

              {/* Description */}
              <TabsContent value="description" className="mt-5 space-y-5">
                <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {gig.description}
                </div>
                {gig.skills_required?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-foreground">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {gig.skills_required.map((s) => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews" className="mt-5 space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">No reviews yet — be the first!</p>
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-white rounded-xl border border-border"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                            {r.client_name?.[0] ?? "C"}
                          </AvatarFallback>
                        </Avatar>
                        <StarRating rating={r.rating} size="sm" showValue={false} />
                        <span className="text-xs text-muted-foreground">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString(undefined, {
                                year: "numeric", month: "short", day: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* FAQ */}
              {gig.faq?.length > 0 && (
                <TabsContent value="faq" className="mt-5 space-y-3">
                  {gig.faq.map((f, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-xl">
                      <p className="font-semibold text-sm text-foreground mb-1">
                        Q: {f.question}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        A: {f.answer}
                      </p>
                    </div>
                  ))}
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            <PackageTabs
              packages={gig.packages}
              selected={selectedPkg}
              onSelect={setSelectedPkg}
            />
            <OrderCard
              pkg={pkg}
              onOrder={handleOrder}
              onContact={handleContact}
            />
          </div>

        </div>
      </div>
    </div>
  );
}