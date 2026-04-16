// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Star,
} from "lucide-react";
import { STATUS_DISPLAY_CONFIG } from "@/lib/orderStatusConfig";

// Map shared config to local format with icons
const getStatusConfig = (status) => {
  const config = STATUS_DISPLAY_CONFIG[status] || STATUS_DISPLAY_CONFIG.pending;
  return {
    label: config.label,
    color: config.badge,
    icon: config.icon,
  };
};

export default function StudentOrderCard({ order, onViewClick }) {
  const statusCfg = getStatusConfig(order.status);
  const StatusIcon = statusCfg.icon;

  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {order.gig_title}
              </h3>
              <Badge
                className={`shrink-0 ${statusCfg.color}`}
                variant="secondary"
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusCfg.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              Client: <span className="font-medium">{order.client_name}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Package: <span className="font-medium">{order.package_name}</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary">
              ₱{order.amount?.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.delivery_days} days
            </p>
          </div>
        </div>

        {/* Requirements preview */}
        {order.requirements && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              Requirements:
            </p>
            <p className="text-sm text-foreground line-clamp-2">
              {order.requirements}
            </p>
          </div>
        )}

        {/* Order meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {order.due_date
              ? `Due ${new Date(order.due_date).toLocaleDateString()}`
              : "No due date"}
          </div>
          <span className="font-mono">
            #{order.id?.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* Action button */}
        <Link to={`/student/orders/${order.id}`}>
          <Button className="w-full gap-2" size="sm">
            {order.status === "awaiting_payment"
              ? "Review & Approve"
              : order.status === "pending"
                ? "Start Work"
                : order.status === "in_progress"
                  ? "Deliver Work"
                  : order.status === "revision_requested"
                    ? "Submit Revision"
                    : "View Order"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
