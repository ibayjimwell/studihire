import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/mockBase44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Plus,
  Star,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  paused: "bg-yellow-100 text-yellow-700",
  removed: "bg-red-100 text-red-700",
};

export default function StudentGigsTab({ studentId, verificationStatus }) {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    base44.entities.Gig.filter(
      { student_id: studentId },
      "-created_date",
      20,
    ).then((data) => {
      setGigs(data);
      setLoading(false);
    });
  }, [studentId]);

  const toggleStatus = async (gig) => {
    setTogglingId(gig.id);
    const newStatus = gig.status === "active" ? "paused" : "active";
    await base44.entities.Gig.update(gig.id, { status: newStatus });
    setGigs((gs) =>
      gs.map((g) => (g.id === gig.id ? { ...g, status: newStatus } : g)),
    );
    setTogglingId(null);
  };

  const deleteGig = async (gigId) => {
    if (!confirm("Delete this gig? This cannot be undone.")) return;
    setDeletingId(gigId);
    await base44.entities.Gig.delete(gigId);
    setGigs((gs) => gs.filter((g) => g.id !== gigId));
    setDeletingId(null);
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {gigs.length} gig{gigs.length !== 1 ? "s" : ""}
        </p>
        {verificationStatus === "approved" && (
          <Button
            size="sm"
            className="gradient-primary text-white border-0 gap-1"
            asChild
          >
            <Link to="/student/gigs/new">
              <Plus className="w-4 h-4" /> New Gig
            </Link>
          </Button>
        )}
      </div>

      {verificationStatus !== "approved" && gigs.length === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-foreground text-sm">
              Verification required
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can post gigs once your profile is approved by an admin.
            </p>
          </CardContent>
        </Card>
      )}

      {gigs.length === 0 && verificationStatus === "approved" && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-foreground text-sm">No gigs yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start offering your services!
            </p>
            <Button
              size="sm"
              className="mt-4 gradient-primary text-white border-0"
              asChild
            >
              <Link to="/student/gigs/new">Create Your First Gig</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {gigs.map((gig) => (
          <Card key={gig.id} className="border-border overflow-hidden">
            {gig.cover_image_url && (
              <img
                src={gig.cover_image_url}
                alt={gig.title}
                className="w-full h-32 object-cover"
              />
            )}
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {gig.title}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[gig.status]}`}
                >
                  {gig.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{gig.category}</p>
              {gig.rating > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  {gig.rating?.toFixed(1)} ({gig.total_reviews} reviews)
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-xs gap-1"
                  onClick={() => toggleStatus(gig)}
                  disabled={togglingId === gig.id}
                >
                  {togglingId === gig.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : gig.status === "active" ? (
                    <>
                      <EyeOff className="w-3 h-3" /> Pause
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" /> Activate
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => deleteGig(gig.id)}
                  disabled={deletingId === gig.id}
                >
                  {deletingId === gig.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
