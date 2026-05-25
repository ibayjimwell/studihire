import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import GigCard from "@/components/shared/GigCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gigBrowse, gigFetchStudentProfiles } from "@/api/gigApi";
import { credentialFilterStudents } from "@/api/credentialApi";
import { CATEGORIES } from "@/lib/roles";
import { Search, Award } from "lucide-react";

// Map UI values → gigBrowse sort keys
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Highest Rated" },
  { value: "orders", label: "Most Orders" },
  { value: "credentials", label: "Best Credentials" },
];

const CREDENTIAL_FILTERS = [
  { value: 0, label: "Any Credentials" },
  { value: 30, label: "Verified (30+)" },
  { value: 60, label: "Strong (60+)" },
  { value: 80, label: "Top Credentials (80+)" },
];

export default function GigsBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Controlled filter state driven from URL params ─────────────────────
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "credentials");
  const [credentialFilter, setCredentialFilter] = useState(
    Number(searchParams.get("credential_filter") || 0),
  );

  // ── Data state ──────────────────────────────────────────────────────────
  const [gigs, setGigs] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search input
  const searchDebounceRef = useRef(null);

  // ── Sync filters → URL ──────────────────────────────────────────────────
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (sort && sort !== "credentials") params.sort = sort;
    if (credentialFilter > 0) params.credential_filter = String(credentialFilter);
    setSearchParams(params, { replace: true });
  }, [search, category, sort, credentialFilter]);

  // ── Fetch gigs whenever filters change ──────────────────────────────────
  const fetchGigs = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If credential filter is active, first get eligible student IDs
    let studentIdFilter = null;
    if (credentialFilter > 0) {
      const { studentIds } = await credentialFilterStudents({
        search: credentialFilter > 30 ? "" : search,
        min_credential_score: credentialFilter,
      });
      if (studentIds.length === 0) {
        setGigs([]);
        setCount(0);
        setProfileMap({});
        setLoading(false);
        return;
      }
      studentIdFilter = studentIds;
    }

    const { gigs: data, count: total, error: fetchError } = await gigBrowse({
      search,
      category,
      sort: sort === "credentials" ? "rating" : sort,
      limit: 24,
      student_ids: studentIdFilter,
    });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setGigs(data);
    setCount(total);

    // Batch-load student profiles for every unique student_id in results
    const uniqueIds = [
      ...new Set(data.map((g) => g.student_id).filter(Boolean)),
    ];
    const { profileMap: map } = await gigFetchStudentProfiles(uniqueIds);
    setProfileMap(map);

    setLoading(false);
  }, [search, category, sort, credentialFilter]);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
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
    setSort("credentials");
    setCredentialFilter(0);
  };

  const hasActiveFilters =
    search || category || sort !== "credentials" || credentialFilter > 0;

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

            {/* Credential filter */}
            <Select
              value={String(credentialFilter)}
              onValueChange={(v) => setCredentialFilter(Number(v))}
            >
              <SelectTrigger className="w-full sm:w-52 bg-white text-sm h-10">
                <SelectValue placeholder="Any Credentials" />
              </SelectTrigger>
              <SelectContent>
                {CREDENTIAL_FILTERS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    <span className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-yellow-500" />
                      {o.label}
                    </span>
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

        {/* ── Active credential badge ── */}
        {credentialFilter > 0 && (
          <div className="mb-4">
            <Badge
              variant="secondary"
              className="gap-1.5 py-1.5 px-3 text-xs"
            >
              <Award className="w-3 h-3 text-yellow-500" />
              Credential filter: {CREDENTIAL_FILTERS.find((f) => f.value === credentialFilter)?.label}
              <button
                onClick={() => setCredentialFilter(0)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          </div>
        )}

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
            {Array(8)
              .fill(0)
              .map((_, i) => (
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