import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { VERIFICATION_BADGE_CONFIG } from '@/lib/roles';
import { cn } from '@/lib/utils';

const icons = {
  approved: CheckCircle,
  pending: Clock,
  rejected: XCircle,
  resubmit_required: RefreshCw,
};

export default function VerificationBadge({ status, size = 'sm' }) {
  const config = VERIFICATION_BADGE_CONFIG[status] || VERIFICATION_BADGE_CONFIG.pending;
  const Icon = icons[status] || Clock;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-medium rounded-full border',
      config.color,
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
      'border-current/20'
    )}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
}

