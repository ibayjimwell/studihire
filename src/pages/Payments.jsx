import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { base44 } from "@/api/mockBase44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  DollarSign,
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  GraduationCap,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
} from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
  paid: { color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  released: { color: "bg-green-100 text-green-700", icon: CheckCircle },
  failed: { color: "bg-red-100 text-red-700", icon: XCircle },
  refunded: { color: "bg-gray-100 text-gray-700", icon: XCircle },
  disputed: { color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  cancelled: { color: "bg-gray-100 text-gray-500", icon: XCircle },
};

export default function Payments({ role = "student" }) {
  const { user } = useCurrentUser();
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [loading, setLoading] = useState(false);

  const studentSidebarLinks = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/gigs", label: "My Gigs", icon: Briefcase },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/student/payments", label: "Earnings", icon: DollarSign },
    { href: "/student/profile", label: "My Profile", icon: GraduationCap },
  ];

  const clientSidebarLinks = [
    { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/client/projects", label: "My Projects", icon: Briefcase },
    { href: "/gigs", label: "Browse Gigs", icon: Search },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/client/payments", label: "Payments", icon: DollarSign },
  ];

  useEffect(() => {
    if (!user) return;
    const filter =
      role === "student" ? { student_id: user.id } : { client_id: user.id };
    base44.entities.Payment.filter(filter, "-created_date", 50).then(
      setPayments,
    );
  }, [user, role]);

  const totalEarned = payments
    .filter((p) => p.status === "released")
    .reduce(
      (s, p) => s + (role === "student" ? p.net_amount : p.amount) || 0,
      0,
    );
  const pending = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const handleDispute = async () => {
    if (!selected || !disputeReason.trim()) return;
    setLoading(true);
    await base44.entities.Dispute.create({
      payment_id: selected.id,
      raised_by: user?.id,
      against: role === "student" ? selected.client_id : selected.student_id,
      reason: disputeReason,
      status: "open",
    });
    await base44.entities.Payment.update(selected.id, { status: "disputed" });
    setSelected(null);
    setDisputeReason("");
    setLoading(false);
  };

  const sidebarLinks =
    role === "student" ? studentSidebarLinks : clientSidebarLinks;

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      sidebarTitle={role === "student" ? "Student" : "Client"}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {role === "student" ? "My Earnings" : "Payments"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your transaction history
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {role === "student" ? "Total Earned" : "Total Spent"}
            </p>
            <p className="text-2xl font-bold text-primary mt-1">
              ₱{totalEarned.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              ₱{pending.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {payments.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PayMongo notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">
            PayMongo Integration
          </p>
          <p className="text-xs text-blue-600">
            Secure payments powered by PayMongo. All transactions are processed
            securely via the platform.
            <br />
            <span className="font-medium">
              Note for Next.js migration:
            </span>{" "}
            Connect PayMongo via secure backend environment variables and
            webhook handlers at{" "}
            <code className="bg-blue-100 px-1 rounded">
              /api/webhooks/paymongo
            </code>
            .
          </p>
        </div>
      </div>

      {/* Transactions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payments.length === 0 ? (
            <div className="text-center py-10">
              <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No transactions yet
              </p>
            </div>
          ) : (
            payments.map((p) => {
              const StatusIcon = statusConfig[p.status]?.icon || Clock;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${statusConfig[p.status]?.color}`}
                  >
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {p.description || "Payment"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.created_date
                        ? format(new Date(p.created_date), "MMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      ₱{p.amount?.toLocaleString()}
                    </p>
                    {role === "student" && p.net_amount && (
                      <p className="text-xs text-muted-foreground">
                        Net: ₱{p.net_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[p.status]?.color}`}
                  >
                    {p.status}
                  </span>
                  {p.status === "released" || p.status === "paid" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-orange-600 text-xs"
                      onClick={() => setSelected(p)}
                    >
                      Dispute
                    </Button>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Dispute dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Raise a
              Dispute
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Describe the issue with this payment. Our team will review it
              within 2–3 business days.
            </p>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium">
                Payment: ₱{selected?.amount?.toLocaleString()}
              </p>
              <p className="text-muted-foreground text-xs">
                {selected?.description}
              </p>
            </div>
            <Textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Explain the issue in detail..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white border-0"
              onClick={handleDispute}
              disabled={loading || !disputeReason.trim()}
            >
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
