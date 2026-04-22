import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { CATEGORIES } from "@/lib/roles";
import { gigCreate, gigUploadCoverImage } from "@/api/gigApi";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  X,
  Upload,
  Loader2,
  Briefcase,
  LayoutDashboard,
  MessageSquare,
  DollarSign,
  GraduationCap,
} from "lucide-react";

const sidebarLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/gigs",      label: "My Gigs",   icon: Briefcase },
  { href: "/messages",          label: "Messages",  icon: MessageSquare },
  { href: "/student/payments",  label: "Earnings",  icon: DollarSign },
  { href: "/student/profile",   label: "My Profile",icon: GraduationCap },
];

const DEFAULT_PACKAGE = {
  name: "Basic",
  description: "",
  price: 0,
  delivery_days: 3,
  revisions: 1,
  features: [],
};

export default function GigCreate() {
  const { user }   = useCurrentUser();
  const navigate   = useNavigate();
  const { toast }  = useToast();

  const [loading,        setLoading]        = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [skillInput,     setSkillInput]     = useState("");

  const [gig, setGig] = useState({
    title:           "",
    description:     "",
    category:        "",
    subcategory:     "",
    skills_required: [],
    tags:            [],
    packages:        [{ ...DEFAULT_PACKAGE }],
    cover_image_url: "",
    status:          "active",
  });

  // ── State helpers ───────────────────────────────────────────────────────
  const set = (k, v) => setGig((g) => ({ ...g, [k]: v }));

  const setPackage = (i, k, v) => {
    const pkgs = [...gig.packages];
    pkgs[i] = { ...pkgs[i], [k]: v };
    set("packages", pkgs);
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || gig.skills_required.includes(trimmed)) return;
    set("skills_required", [...gig.skills_required, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill) =>
    set("skills_required", gig.skills_required.filter((s) => s !== skill));

  const addPackage = () =>
    set("packages", [
      ...gig.packages,
      {
        name:          `Package ${gig.packages.length + 1}`,
        description:   "",
        price:         0,
        delivery_days: 5,
        revisions:     2,
        features:      [],
      },
    ]);

  const removePackage = (i) =>
    set("packages", gig.packages.filter((_, j) => j !== i));

  // ── Image upload ────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setImageUploading(true);
    const { url, error } = await gigUploadCoverImage(file, user.id);

    if (error) {
      toast({
        title:       "Image upload failed",
        description: error.message,
        variant:     "destructive",
      });
    } else {
      set("cover_image_url", url);
    }
    setImageUploading(false);
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);

    const { gig: created, error } = await gigCreate(gig);

    if (error) {
      toast({
        title:       "Failed to publish gig",
        description: error.message,
        variant:     "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title:       "Gig published! 🎉",
      description: `"${created.title}" is now live on the marketplace.`,
    });
    navigate("/student/gigs");
  };

  const isSubmitDisabled =
    loading || imageUploading || !gig.title.trim() || !gig.category;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Student">
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Create a Gig</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Offer your skills to clients on the marketplace
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Gig Details ── */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Gig Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <Label>Gig Title *</Label>
                <Input
                  className="mt-1"
                  value={gig.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="I will design a professional logo for your brand"
                />
              </div>

              {/* Category + Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select
                    value={gig.category}
                    onValueChange={(v) => set("category", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subcategory</Label>
                  <Input
                    className="mt-1"
                    value={gig.subcategory}
                    onChange={(e) => set("subcategory", e.target.value)}
                    placeholder="e.g. Logo Design"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description *</Label>
                <Textarea
                  className="mt-1"
                  rows={5}
                  value={gig.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe what you offer, your process, and what clients can expect..."
                />
              </div>

              {/* Skills */}
              <div>
                <Label>Skills</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a skill"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addSkill}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {gig.skills_required.map((s) => (
                    <Badge
                      key={s}
                      className="bg-secondary text-secondary-foreground pr-1 gap-1"
                    >
                      {s}
                      <button onClick={() => removeSkill(s)} aria-label={`Remove ${s}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Packages ── */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Packages</CardTitle>
              <Button size="sm" variant="outline" onClick={addPackage}>
                <Plus className="w-4 h-4 mr-1" /> Add Package
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {gig.packages.map((pkg, i) => (
                <div
                  key={i}
                  className="p-4 border border-border rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Input
                      className="max-w-[140px] font-medium"
                      value={pkg.name}
                      onChange={(e) => setPackage(i, "name", e.target.value)}
                    />
                    {gig.packages.length > 1 && (
                      <button
                        onClick={() => removePackage(i)}
                        className="text-destructive hover:opacity-70"
                        aria-label="Remove package"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <Textarea
                    rows={2}
                    value={pkg.description}
                    onChange={(e) => setPackage(i, "description", e.target.value)}
                    placeholder="What's included in this package?"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Price (₱)</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        value={pkg.price}
                        onChange={(e) => setPackage(i, "price", +e.target.value)}
                        min={0}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Delivery (days)</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        value={pkg.delivery_days}
                        onChange={(e) => setPackage(i, "delivery_days", +e.target.value)}
                        min={1}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Revisions</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        value={pkg.revisions}
                        onChange={(e) => setPackage(i, "revisions", +e.target.value)}
                        min={0}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Cover Image ── */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Cover Image</CardTitle>
            </CardHeader>
            <CardContent>
              {gig.cover_image_url ? (
                <div className="relative">
                  <img
                    src={gig.cover_image_url}
                    alt="Gig cover"
                    className="w-full aspect-video object-cover rounded-xl"
                  />
                  <button
                    onClick={() => set("cover_image_url", "")}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:bg-gray-50 transition-colors"
                    aria-label="Remove cover image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  {imageUploading ? (
                    <>
                      <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Uploading…
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium">Upload cover image</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        JPG or PNG, 1280×720 recommended
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    disabled={imageUploading}
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* ── Actions ── */}
          <div className="flex gap-3 justify-end pb-8">
            <Button
              variant="outline"
              onClick={() => navigate("/student/gigs")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white border-0 px-8"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Publish Gig
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}