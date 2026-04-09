import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StarRating({ rating = 0, max = 5, size = 'sm', showValue = true }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'fill-current',
              size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5',
              i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-200'
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className={cn('font-medium text-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

