import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import { base44 } from "@/api/mockBase44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  ShieldCheck,
  Clock,
  RefreshCw,
  Loader2,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || "";
const PLATFORM_FEE_PERCENT = 0.1;

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const gigId = params.get("gig_id");
  const pkgIndex = parseInt(params.get("pkg") || "0", 10);

  const [gig, setGig] = useState(null);
  const [student, setStudent] = useState(null);
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [clientProfile, setClientProfile] = useState(null);

  useEffect(() => {
    if (!gigId) return;
    base44.entities.Gig.filter({ id: gigId }, "-created_date", 1).then(
      async ([g]) => {
        setGig(g);
        if (g?.student_id) {
          const profiles = await base44.entities.StudentProfile.filter(
            { user_id: g.student_id },
            "-created_date",
            1,
          );
          setStudent(profiles[0] || null);
        }
        setLoading(false);
      },
    );
  }, [gigId]);

  useEffect(() => {
    if (!user) return;
    base44.entities.ClientProfile.filter(
      { user_id: user.id },
      "-created_date",
      1,
    ).then((p) => {
      setClientProfile(p[0] || null);
    });
  }, [user]);

  const pkg = gig?.packages?.[pkgIndex];
  const amount = pkg?.price || 0;
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT);
  const netAmount = amount - platformFee;

  const handlePayWithPayMongo = async () => {
    if (!user || !gig || !pkg) return;
    if (!requirements.trim()) {
      setError("Please describe your project requirements for the student.");
      return;
    }
    setError("");
    setPaying(true);

    // Create a pending order first
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (pkg.delivery_days || 7));

    const order = await base44.entities.Order.create({
      gig_id: gig.id,
      gig_title: gig.title,
      client_id: user.id,
      client_name: user.full_name,
      student_id: gig.student_id,
      student_name: student?.full_name || "",
      package_name: pkg.name,
      package_index: pkgIndex,
      amount,
      delivery_days: pkg.delivery_days,
      revisions: pkg.revisions,
      requirements,
      status: "awaiting_payment",
      due_date: dueDate.toISOString(),
    });

    // Create PayMongo checkout session
    try {
      const response = await fetch(
        "https://api.paymongo.com/v1/checkout_sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(PAYMONGO_PUBLIC_KEY + ":")}`,
          },
          body: JSON.stringify({
            data: {
              attributes: {
                line_items: [
                  {
                    currency: "PHP",
                    amount: amount * 100,
                    name: `${gig.title} - ${pkg.name}`,
                    quantity: 1,
                  },
                ],
                payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
                success_url: `${window.location.origin}/order/${order.id}?payment=success`,
                cancel_url: `${window.location.origin}/checkout?gig_id=${gigId}&pkg=${pkgIndex}&cancelled=1`,
                metadata: {
                  order_id: order.id,
                  client_id: user.id,
                  student_id: gig.student_id,
                },
              },
            },
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.errors?.[0]?.detail || "PayMongo error");
      }

      const data = await response.json();
      const checkoutUrl = data?.data?.attributes?.checkout_url;
      const sessionId = data?.data?.id;

      await base44.entities.Order.update(order.id, {
        paymongo_payment_intent_id: sessionId,
        paymongo_checkout_url: checkoutUrl,
      });

      // Redirect to PayMongo hosted checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      // Fallback: if no public key set, simulate payment for demo
      if (!PAYMONGO_PUBLIC_KEY) {
        const payment = await base44.entities.Payment.create({
          client_id: user.id,
          student_id: gig.student_id,
          gig_id: gig.id,
          amount,
          platform_fee: platformFee,
          net_amount: netAmount,
          currency: "PHP",
          status: "paid",
          description: `${gig.title} - ${pkg.name}`,
          payment_method: "demo",
        });
        await base44.entities.Order.update(order.id, {
          status: "pending",
          payment_id: payment.id,
        });
        await base44.entities.Notification.create({
          user_id: gig.student_id,
          type: "gig_order",
          title: "🎉 New Order!",
          body: `${user.full_name} ordered your gig: ${gig.title}`,
          link: `/order/${order.id}`,
          is_read: false,
        });
        navigate(`/order/${order.id}?payment=success`);
      } else {
        setError(err.message || "Payment failed. Please try again.");
        await base44.entities.Order.update(order.id, { status: "cancelled" });
      }
    }
    setPaying(false);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );

  if (!gig || !pkg)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-20 text-muted-foreground">
          Gig or package not found.
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Review your order and complete payment securely via PayMongo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left: Requirements */}
          <div className="md:col-span-3 space-y-5">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gig</span>
                  <span className="font-medium max-w-[200px] text-right">
                    {gig.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-medium">{pkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pkg.delivery_days} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revisions</span>
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    {pkg.revisions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Freelancer</span>
                  <span className="font-medium">
                    {student?.full_name || "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Project Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe exactly what you need. Include any files, links, or instructions for the student..."
                  rows={5}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This will be shared with the student when your order is
                  confirmed.
                </p>
              </CardContent>
            </Card>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!PAYMONGO_PUBLIC_KEY && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  <strong>Demo Mode:</strong> No PayMongo key configured.
                  Payment will be simulated. Add{" "}
                  <code>VITE_PAYMONGO_PUBLIC_KEY</code> to enable real payments.
                </p>
              </div>
            )}

            <Button
              className="w-full gradient-primary text-white border-0 h-12 text-base gap-2"
              onClick={handlePayWithPayMongo}
              disabled={paying}
            >
              {paying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              {paying
                ? "Processing..."
                : `Pay ₱${amount.toLocaleString()} via PayMongo`}
            </Button>
          </div>

          {/* Right: Summary */}
          <div className="md:col-span-2">
            <Card className="border-border sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₱{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Platform fee (10%)
                  </span>
                  <span>₱{platformFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary">
                    ₱{amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform fee is deducted from student's payout.
                </p>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    Secure escrow — funds held until delivery
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    Free revisions per package
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="w-4 h-4 text-primary shrink-0" />
                    Accepts GCash, Card, Maya, GrabPay
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
