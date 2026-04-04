import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import StarRating from './StarRating';
import VerificationBadge from './VerificationBadge';
import { Heart } from 'lucide-react';
import { useState } from 'react';

export default function GigCard({ gig, student }) {
  const [liked, setLiked] = useState(false);
  const lowestPrice = gig.packages?.[0]?.price || 0;

  return (
    <Card className="group overflow-hidden card-hover border-border bg-card cursor-pointer">
      <Link to={`/gigs/${gig.id}`}>
        {/* Cover image */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {gig.cover_image_url ? (
            <img
              src={gig.cover_image_url}
              alt={gig.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full gradient-hero flex items-center justify-center">
              <span className="text-4xl text-white/30 font-bold">{gig.category?.[0]}</span>
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 backdrop-blur shadow-sm hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
          <Badge className="absolute top-3 left-3 bg-white/90 text-foreground text-xs font-medium shadow-sm border-0">
            {gig.category}
          </Badge>
        </div>
      </Link>

      <div className="p-4">
        {/* Student info */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-7 h-7">
            <AvatarImage src={student?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {student?.full_name?.[0] || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {student?.full_name || 'Student'}
            </span>
            {student?.verification_status === 'approved' && (
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-white text-[9px] font-bold">✓</span>
              </span>
            )}
          </div>
        </div>

        <Link to={`/gigs/${gig.id}`}>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 hover:text-primary transition-colors leading-snug">
            {gig.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-3">
          <StarRating rating={gig.rating || 0} />
          <span className="text-xs text-muted-foreground">({gig.total_reviews || 0})</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Starting at</span>
          <span className="text-base font-bold text-foreground">
            ₱{lowestPrice.toLocaleString()}
          </span>
        </div>
      </div>
    </Card>
  );
}

