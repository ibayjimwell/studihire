import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Sidebar({ links, title }) {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-1 sticky top-20 self-start">
      {title && (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
          {title}
        </p>
      )}
      {links.map(link => {
        const Icon = link.icon;
        const active = location.pathname === link.href || location.pathname.startsWith(link.href + '/');
        return (
          <Link
            key={link.href}
            to={link.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{link.label}</span>
            {link.badge && (
              <span className={cn(
                'ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium',
                active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
              )}>
                {link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}