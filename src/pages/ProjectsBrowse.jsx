import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import ProjectCard from "@/components/shared/ProjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from "@/api/mockBase44Client";
import { CATEGORIES } from "@/lib/roles";
import { Search } from "lucide-react";

export default function ProjectsBrowse() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [budgetType, setBudgetType] = useState("");

  useEffect(() => {
    setLoading(true);
    const filter = { status: "open" };
    if (category) filter.category = category;
    if (budgetType) filter.budget_type = budgetType;

    base44.entities.Project.filter(filter, "-created_date", 30).then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, [category, budgetType]);

  const filtered = projects.filter(
    (p) =>
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.skills_needed?.some((s) =>
        s.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="bg-gradient-to-r from-blue-50 to-accent py-10 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Find Projects
          </h1>
          <p className="text-muted-foreground mb-6">
            Browse open projects posted by verified clients
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects or skills..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={budgetType} onValueChange={setBudgetType}>
              <SelectTrigger className="w-36 bg-white">
                <SelectValue placeholder="Budget type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Types</SelectItem>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!category ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
          {CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? "" : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          {loading ? "Loading..." : `${filtered.length} projects found`}
        </p>

        {loading ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-lg font-semibold">No projects found</p>
            <p className="text-muted-foreground text-sm">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
