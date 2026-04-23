import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import GigCard from "@/components/shared/GigCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gigBrowse, gigFetchStudentProfiles } from "@/api/gigApi";
import { CATEGORIES } from "@/lib/roles";
import { Search } from "lucide-react";

// Map UI values → gigBrowse sort keys
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Highest Rated" },
  { value: "orders", label: "Most Orders" },
];

export default function GigsBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Controlled filter state driven from URL params ─────────────────────
  const [search,   setSearch]   = useState(searchParams.get("search")   ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [sort,     setSort]     = useState(searchParams.get("sort")      ?? "newest");

  // ── Data state ──────────────────────────────────────────────────────────
  const [gigs,       setGigs]       = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [count,      setCount]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Debounce search input so we don't fire on every keystroke
  const searchDebounceRef = useRef(null);

  // ── Sync filters → URL ──────────────────────────────────────────────────
  useEffect(() => {
    const params = {};
    if (search)   params.search   = search;
    if (category) params.category = category;
    if (sort && sort !== "newest") params.sort = sort;
    setSearchParams(params, { replace: true });
  }, [search, category, sort]);

  // ── Fetch gigs whenever filters change ──────────────────────────────────
  const fetchGigs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { gigs: data, count: total, error: fetchError } = await gigBrowse({
      search,
      category,
      sort,
      limit: 24,
    });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setGigs(data);
    setCount(total);

    // Batch-load student profiles for every unique student_id in results
    const uniqueIds = [...new Set(data.map((g) => g.student_id).filter(Boolean))];
    const { profileMap: map } = await gigFetchStudentProfiles(uniqueIds);
    setProfileMap(map);

    setLoading(false);
  }, [search, category, sort]);

  useEffect(() => { fetchGigs(); }, [fetchGigs]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Update input immediately for responsiveness
    setSearch(value);
    // Debounce the actual query by 350ms
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
    }, 350);
  };

  const handleCategoryToggle = (cat) => {
    setCategory((prev) => (prev === cat ? "" : cat));
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setSort("newest");
  };

  const hasActiveFilters = search || category || sort !== "newest";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero / search header ── */}
      <div className="bg-gradient-to-r from-primary/10 to-accent py-8 md:py-10 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            Browse Student Gigs
          </h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Hire verified students for your projects
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search gigs or skills…"
                className="pl-9 bg-white text-sm h-10"
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            {/* Sort */}
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-44 bg-white text-sm h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">

        {/* ── Category pill filters ── */}
        <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              !category
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-white border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryToggle(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-white border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Result meta row ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : `${count.toLocaleString()} ${count === 1 ? "gig" : "gigs"} found`}
            {hasActiveFilters && !loading && (
              <button
                onClick={clearFilters}
                className="ml-2 text-primary hover:underline text-sm"
              >
                Clear filters
              </button>
            )}
          </p>
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="text-center py-16">
            <p className="text-destructive font-medium">{error}</p>
            <button
              onClick={fetchGigs}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && gigs.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground">No gigs found</p>
            <p className="text-muted-foreground text-sm mt-1">
              Try adjusting your search or filters
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Gig grid ── */}
        {!loading && !error && gigs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {gigs.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                student={profileMap[gig.student_id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}