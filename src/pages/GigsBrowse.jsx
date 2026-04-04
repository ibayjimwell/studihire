import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import GigCard from '@/components/shared/GigCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { base44 } from '@/api/base44Client';
import { CATEGORIES } from '@/lib/roles';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function GigsBrowse() {
  const [gigs, setGigs] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-created_date');

  const urlParams = new URLSearchParams(window.location.search);

  useEffect(() => {
    const catParam = urlParams.get('category');
    if (catParam) setCategory(catParam);
  }, []);

  useEffect(() => {
    setLoading(true);
    const filter = { status: 'active' };
    if (category) filter.category = category;

    base44.entities.Gig.filter(filter, sort, 24).then(async (data) => {
      setGigs(data);
      const ids = [...new Set(data.map(g => g.student_id))];
      const profiles = await Promise.all(
        ids.map(id => base44.entities.StudentProfile.filter({ user_id: id }, '-created_date', 1).then(r => r[0]))
      );
      const map = {};
      profiles.forEach(p => { if (p) map[p.user_id] = p; });
      setStudents(map);
      setLoading(false);
    });
  }, [category, sort]);

  const filtered = gigs.filter(g =>
    !search || g.title?.toLowerCase().includes(search.toLowerCase()) ||
    g.skills_required?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent py-10 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Student Gigs</h1>
          <p className="text-muted-foreground mb-6">Hire verified students for your projects</p>
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search gigs or skills..."
                className="pl-9 bg-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_date">Newest First</SelectItem>
                <SelectItem value="-rating">Highest Rated</SelectItem>
                <SelectItem value="-total_orders">Most Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!category ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white border border-border text-muted-foreground hover:text-foreground'}`}
          >
            All Categories
          </button>
          {CATEGORIES.slice(0, 8).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? '' : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white border border-border text-muted-foreground hover:text-foreground'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-5">
          {loading ? 'Loading...' : `${filtered.length} gigs found`}
          {category && <button onClick={() => setCategory('')} className="ml-2 text-primary hover:underline text-sm">Clear filter</button>}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-lg font-semibold text-foreground">No gigs found</p>
            <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(gig => (
              <GigCard key={gig.id} gig={gig} student={students[gig.student_id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}