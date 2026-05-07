// @ts-nocheck
import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import { orderGetById } from "@/api/orderApi";
import {
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  Package,
  MessageSquare,
} from "lucide-react";

export default function OrderConfirmation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isPlaced = searchParams.get("status") === "placed";

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      const { order: orderData, error: orderErr } = await orderGetById(id);

      if (orderErr || !orderData) {
        setError("Order not found.");
        setLoading(false);
        return;
      }

      setOrder(orderData);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-20">
          <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-lg font-semibold">{error || "Order not found."}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/client/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Success banner */}
        {isPlaced && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white mb-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Order Placed Successfully! 🎉
            </h1>
            <p className="text-white/80 text-sm sm:text-base">
              Your order has been sent to the student. They will review it and
              start working on it soon.
            </p>
          </div>
        )}

        {/* Order card */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Order ID
                </p>
                <p className="text-sm font-mono text-foreground mt-0.5">
                  {order.id}
                </p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-gray-100 text-gray-700">
                {order.status?.replace(/_/g, " ")}
              </span>
            </div>

            {/* Gig info */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Gig
              </p>
              <p className="font-semibold text-foreground text-base">
                {order.gig_title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {order.package_name} Package · by{" "}
                {order.student_name || "Student"}
              </p>
            </div>

            {/* Requirements */}
            {order.requirements && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Your Requirements
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {order.requirements}
                </p>
              </div>
            )}

            {/* Pricing */}
            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Package price</span>
                <span>₱{Number(order.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform fee</span>
                <span>₱{Number(order.platform_fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">
                  ₱{Number(order.amount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Delivery info */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Expected delivery:{" "}
                  <strong className="text-foreground">
                    {order.due_date
                      ? new Date(order.due_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Next steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-semibold text-blue-900 text-sm mb-2">
                📋 What happens next?
              </p>
              <ol className="space-y-1.5 text-blue-800 text-xs list-decimal list-inside">
                <li>The student will be notified of your order</li>
                <li>
                  Payment will be collected once the student starts working
                </li>
                <li>
                  You can message the student directly if you have questions
                </li>
                <li>
                  Track your order status in{" "}
                  <Link
                    to="/client/orders"
                    className="underline font-semibold hover:text-blue-700"
                  >
                    My Orders
                  </Link>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => navigate("/messages")}
          >
            <MessageSquare className="w-4 h-4" /> Message Student
          </Button>
          <Button
            className="gradient-primary text-white border-0 flex-1 gap-2"
            onClick={() => navigate("/client/orders")}
          >
            <Package className="w-4 h-4" /> View My Orders
          </Button>
        </div>
      </div>
    </div>
  );
}