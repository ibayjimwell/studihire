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
import { base44 } from "@/api/mockBase44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { CATEGORIES } from "@/lib/roles";
import {
  Plus,
  X,
  Upload,
  Loader2,
  Briefcase,
  LayoutDashboard,
  MessageSquare,
  DollarSign,
  FileText,
  Settings,
  Search,
} from "lucide-react";

const sidebarLinks = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/projects", label: "My Projects", icon: Briefcase },
  { href: "/client/applications", label: "Applications", icon: FileText },
  { href: "/gigs", label: "Browse Gigs", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/client/payments", label: "Payments", icon: DollarSign },
];

export default function ProjectCreate() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [project, setProject] = useState({
    title: "",
    description: "",
    category: "",
    skills_needed: [],
    budget_min: "",
    budget_max: "",
    budget_type: "fixed",
    deadline: "",
    visibility: "public",
  });

  const set = (k, v) => setProject((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    await base44.entities.Project.create({
      ...project,
      client_id: user?.id,
      budget_min: +project.budget_min,
      budget_max: +project.budget_max,
      status: "open",
      proposals_count: 0,
    });
    navigate("/client/projects");
  };

  const addSkill = () => {
    if (
      skillInput.trim() &&
      !project.skills_needed.includes(skillInput.trim())
    ) {
      set("skills_needed", [...project.skills_needed, skillInput.trim()]);
      setSkillInput("");
    }
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Client">
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Post a Project</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Describe what you need and let students apply
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Project Title *</Label>
                <Input
                  className="mt-1"
                  value={project.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Build a responsive landing page"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select
                  value={project.category}
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
                <Label>Description *</Label>
                <Textarea
                  className="mt-1"
                  rows={6}
                  value={project.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe your project in detail. Include requirements, deliverables, and any specific preferences..."
                />
              </div>
              <div>
                <Label>Skills Needed</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. React, Figma"
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addSkill())
                    }
                  />
                  <Button type="button" variant="outline" onClick={addSkill}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {project.skills_needed.map((s) => (
                    <Badge
                      key={s}
                      className="bg-secondary text-secondary-foreground pr-1 gap-1"
                    >
                      {s}{" "}
                      <button
                        onClick={() =>
                          set(
                            "skills_needed",
                            project.skills_needed.filter((x) => x !== s),
                          )
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Budget & Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Budget Type</Label>
                  <Select
                    value={project.budget_type}
                    onValueChange={(v) => set("budget_type", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Min Budget (₱)</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={project.budget_min}
                    onChange={(e) => set("budget_min", e.target.value)}
                    placeholder="1000"
                    min={0}
                  />
                </div>
                <div>
                  <Label>Max Budget (₱)</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={project.budget_max}
                    onChange={(e) => set("budget_max", e.target.value)}
                    placeholder="5000"
                    min={0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={project.deadline}
                    onChange={(e) => set("deadline", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Visibility</Label>
                  <Select
                    value={project.visibility}
                    onValueChange={(v) => set("visibility", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="invite_only">Invite Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => navigate("/client/projects")}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-8"
              onClick={handleSubmit}
              disabled={loading || !project.title || !project.category}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Post Project
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
