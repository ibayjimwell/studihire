import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  open: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-500',
};

export default function ProjectCard({ project }) {
  return (
    <Card className="card-hover border-border bg-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className="bg-secondary text-secondary-foreground text-xs border-0">
                {project.category}
              </Badge>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[project.status]}`}>
                {project.status?.replace('_', ' ')}
              </span>
            </div>
            <Link to={`/projects/${project.id}`}>
              <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                {project.title}
              </h3>
            </Link>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary">
              ₱{project.budget_min?.toLocaleString()}
              {project.budget_max && project.budget_max !== project.budget_min && `–${project.budget_max?.toLocaleString()}`}
            </p>
            <p className="text-xs text-muted-foreground">{project.budget_type}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.skills_needed?.slice(0, 4).map(skill => (
            <span key={skill} className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-md font-medium">
              {skill}
            </span>
          ))}
          {(project.skills_needed?.length || 0) > 4 && (
            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md">
              +{project.skills_needed.length - 4} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {project.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(project.deadline), 'MMM d')}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {project.proposals_count || 0} proposals
            </span>
          </div>
          <Button size="sm" variant="outline" className="gap-1 text-primary border-primary/30 hover:bg-primary hover:text-white" asChild>
            <Link to={`/projects/${project.id}`}>
              Apply <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

