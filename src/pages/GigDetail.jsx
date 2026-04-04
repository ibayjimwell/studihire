import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import StarRating from "@/components/shared/StarRating";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { base44 } from "@/api/mockBase44Client";
import {
  Clock,
  RefreshCw,
  Package,
  MessageSquare,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const [student, setStudent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Gig.filter({ id }, "-created_date", 1),
      base44.entities.Review.filter({ gig_id: id }, "-created_date", 10),
    ]).then(async ([gigs, revs]) => {
      const g = gigs[0];
      setGig(g);
      setReviews(revs);
      if (g?.student_id) {
        const profiles = await base44.entities.StudentProfile.filter(
          { user_id: g.student_id },
          "-created_date",
          1,
        );
        setStudent(profiles[0] || null);
      }
      setLoading(false);
    });
  }, [id]);

  const handleContact = async () => {
    navigate("/messages");
  };

  const handleOrder = () => {
    navigate(`/checkout?gig_id=${id}&pkg=${selectedPkg}`);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );

  if (!gig)
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="text-center py-20">Gig not found</div>
      </div>
    );

  const pkg = gig.packages?.[selectedPkg];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-secondary text-secondary-foreground">
                  {gig.category}
                </Badge>
                {gig.subcategory && (
                  <Badge variant="outline">{gig.subcategory}</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {gig.title}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <StarRating rating={gig.rating || 0} size="md" />
                <span className="text-sm text-muted-foreground">
                  ({gig.total_reviews || 0} reviews)
                </span>
                <span className="text-sm text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">
                  {gig.total_orders || 0} orders
                </span>
              </div>
            </div>

            {/* Cover image */}
            {gig.cover_image_url && (
              <div className="rounded-2xl overflow-hidden aspect-video">
                <img
                  src={gig.cover_image_url}
                  alt={gig.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Student info */}
            {student && (
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-border">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={student.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                    {student.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground">
                      {student.full_name}
                    </h3>
                    <VerificationBadge status={student.verification_status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {student.course} · {student.school_name}
                  </p>
                  <p className="text-sm text-foreground/80 mt-2 line-clamp-2">
                    {student.bio}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {student.skills?.slice(0, 5).map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-md"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
              <TabsContent value="description" className="mt-4">
                <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {gig.description}
                </div>
                {gig.skills_required?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {gig.skills_required.map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="reviews" className="mt-4 space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No reviews yet
                  </p>
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-white rounded-xl border border-border"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            C
                          </AvatarFallback>
                        </Avatar>
                        <StarRating
                          rating={r.rating}
                          size="sm"
                          showValue={false}
                        />
                        <span className="text-xs text-muted-foreground">
                          {r.created_date
                            ? new Date(r.created_date).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80">{r.comment}</p>
                    </div>
                  ))
                )}
              </TabsContent>
              <TabsContent value="faq" className="mt-4 space-y-3">
                {gig.faq?.map((f, i) => (
                  <div key={i} className="p-4 bg-muted/50 rounded-xl">
                    <p className="font-semibold text-sm text-foreground mb-1">
                      Q: {f.question}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      A: {f.answer}
                    </p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Package & order */}
          <div className="space-y-4">
            {gig.packages && gig.packages.length > 1 && (
              <div className="flex rounded-xl overflow-hidden border border-border">
                {gig.packages.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPkg(i)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${selectedPkg === i ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:text-foreground"}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            {pkg && (
              <Card className="border-border shadow-lg">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {pkg.name}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      ₱{pkg.price?.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pkg.description}
                  </p>

                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {pkg.delivery_days}d
                      delivery
                    </span>
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-4 h-4" /> {pkg.revisions}{" "}
                      revisions
                    </span>
                  </div>

                  {pkg.features?.length > 0 && (
                    <ul className="space-y-1.5">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    className="w-full gradient-primary text-white border-0 h-11 gap-2"
                    onClick={handleOrder}
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleContact}
                  >
                    <MessageSquare className="w-4 h-4" /> Contact Student
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
