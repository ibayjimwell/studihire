// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { gigGetById, gigGetStudentProfile } from "@/api/gigApi";
import { orderPlace } from "@/api/orderApi";
import {
  ShieldCheck,
  Clock,
  RefreshCw,
  Loader2,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Star,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

const PLATFORM_FEE_PERCENT = 0.1;

const STEPS = ["Review Order", "Requirements", "Confirm"];

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const gigId = params.get("gig_id");
  const pkgIndex = parseInt(params.get("pkg") || "0", 10);

  const [step, setStep] = useState(0);
  const [gig, setGig] = useState(/** @type {any} */ (null));
  const [student, setStudent] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [fetchError, setFetchError] = useState(/** @type {string|null} */ (null));

  // Form state
  const [requirements, setRequirements] = useState("");
  const [errors, setErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );

  useEffect(() => {
    if (!gigId) {
      setLoading(false);
      setFetchError("No gig ID provided.");
      return;
    }

    (async () => {
      setLoading(true);
      setFetchError(null);

      // Try to fetch the real gig from Supabase
      const { gig: gigData, error: gigErr } = await gigGetById(gigId);

      if (gigErr || !gigData) {
        setFetchError("Gig not found or unavailable.");
        setLoading(false);
        return;
      }

      setGig(gigData);

      // Fetch student profile
      if (gigData.student_id) {
        const { profile } = await gigGetStudentProfile(gigData.student_id);
        setStudent(profile ?? null);
      }

      setLoading(false);
    })();
  }, [gigId]);

  const pkg = gig?.packages?.[pkgIndex];
  const amount = pkg?.price || 0;
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT);

  const validateStep = () => {
    const errs = /** @type {Record<string, string>} */ ({});
    if (step === 1 && !requirements.trim()) {
      errs.requirements = "Please describe your project requirements.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handlePlaceOrder = async () => {
    if (!gig || !student || !pkg) return;

    setPlacing(true);

    const result = await orderPlace({
      gig_id: gig.id,
      student_id: gig.student_id,
      package_name: pkg.name,
      package_index: pkgIndex,
      amount,
      platform_fee: platformFee,
      delivery_days: pkg.delivery_days || 7,
      revisions: pkg.revisions || 0,
      requirements: requirements.trim(),
      gig_title: gig.title,
    });

    setPlacing(false);

    if (result.error) {
      setErrors({ form: result.error.message || "Failed to place order. Please try again." });
      return;
    }

    // Navigate to order success view
    navigate(`/orders/${result.order.id}?status=placed`);
  };

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

  if (fetchError || !gig || !pkg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-20 text-muted-foreground">
          <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground mb-1">
            {fetchError || "Gig or package not found."}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/gigs")}
          >
            Browse Gigs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          to={`/gigs/${gigId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Gig
        </Link>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`flex items-center gap-2 ${i <= step ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    i < step
                      ? "bg-primary border-primary text-white"
                      : i === step
                        ? "border-primary text-primary bg-primary/10"
                        : "border-muted-foreground/30 text-muted-foreground/50"
                  }`}
                >
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`hidden sm:block text-xs font-medium ${i === step ? "text-primary" : ""}`}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Error message */}
            {errors.form && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errors.form}</p>
              </div>
            )}

            {/* STEP 0: Review Order */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Review Your Order</h2>

                {/* Gig summary card */}
                <Card className="border-border overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    {gig.cover_image_url ? (
                      <img
                        src={gig.cover_image_url}
                        alt={gig.title}
                        className="w-20 h-20 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-2xl font-bold text-primary">
                          {gig.title?.[0]}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground leading-snug">
                        {gig.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {student?.full_name || "Student"}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {gig.rating > 0 && (
                          <>
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">
                              {gig.rating?.toFixed(1)} ({gig.total_reviews || 0} reviews)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border px-5 py-4 bg-muted/30">
                    <p className="text-sm font-semibold text-foreground mb-3">
                      📦 {pkg.name} Package
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span>{pkg.delivery_days}-day delivery</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          {pkg.revisions} revision
                          {pkg.revisions !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    {pkg.features?.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {pkg.features.map((f, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />{" "}
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>

                {/* Seller info */}
                {student && (
                  <Card className="border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg shrink-0">
                        {student.full_name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {student.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.institution || student.school_name || ""}
                          {student.field_of_study ? ` · ${student.field_of_study}` : ""}
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-muted-foreground">
                          Verified student
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          ✓ ID Verified
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* STEP 1: Requirements */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Tell the student what you need
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Be as specific as possible — the more detail you give, the
                    better the result.
                  </p>
                </div>

                <Card className="border-border">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-foreground block mb-2">
                        Project Requirements{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        placeholder="Describe your project in detail. For example:&#10;- What do you need done?&#10;- What's the style or tone you prefer?&#10;- Are there any specific references or examples?&#10;- What's the deadline?"
                        rows={7}
                        value={requirements}
                        onChange={(e) => {
                          setRequirements(e.target.value);
                          setErrors({});
                        }}
                        className={
                          errors.requirements
                            ? "border-red-400 focus-visible:ring-red-300"
                            : ""
                        }
                      />
                      {errors.requirements && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.requirements}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {requirements.length} characters · The student will
                        receive this when you confirm your order.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <span className="text-xl shrink-0">💡</span>
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold mb-1">
                        Tips for great results
                      </p>
                      <ul className="space-y-1 text-amber-800 list-disc list-inside text-xs">
                        <li>Share any brand guidelines, colors, or fonts</li>
                        <li>Include reference links or examples you like</li>
                        <li>Mention your target audience</li>
                        <li>State what formats you need the deliverables in</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 2: Confirm */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Confirm Your Order</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please review everything before placing your order.
                  </p>
                </div>

                <Card className="border-border divide-y divide-border">
                  <div className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Gig
                    </p>
                    <p className="font-semibold text-foreground">{gig.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {pkg.name} Package · by {student?.full_name}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Requirements
                    </p>
                    <p className="text-sm text-foreground/80 line-clamp-3">
                      {requirements || "No specific requirements provided."}
                    </p>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Package price</span>
                      <span>₱{amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Platform fee (10%)</span>
                      <span>₱{platformFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                      <span>You'll pay</span>
                      <span className="text-primary">
                        ₱{amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900">
                        Order placed, payment upon start
                      </p>
                      <p className="text-blue-800 text-xs mt-0.5">
                        Your order will be sent to the student. Payment will be
                        collected when the student starts working on your order.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
              {step > 0 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <Button
                  className="gradient-primary text-white border-0 gap-2 px-8"
                  onClick={handleNext}
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  className="gradient-primary text-white border-0 gap-2 px-8 h-11"
                  onClick={handlePlaceOrder}
                  disabled={placing}
                >
                  {placing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {placing ? "Placing Order..." : "Place Order"}
                </Button>
              )}
            </div>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-3">
              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Order Summary
                  </p>
                  <div className="flex gap-3 mb-4">
                    {gig.cover_image_url ? (
                      <img
                        src={gig.cover_image_url}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xl shrink-0">
                        {gig.title?.[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug line-clamp-2">
                        {gig.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pkg.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Price</span>
                      <span>₱{amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Fee (10%)</span>
                      <span>₱{platformFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                      <span>You'll pay</span>
                      <span className="text-primary">
                        ₱{amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      {pkg.delivery_days}-day delivery
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCw className="w-3.5 h-3.5 text-primary shrink-0" />
                      {pkg.revisions} free revision
                      {pkg.revisions !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                      Escrow protection
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1 text-amber-900">
                    ⏰ How it works
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-amber-700">
                    <li>You place the order</li>
                    <li>Student reviews and starts work</li>
                    <li>We charge your payment</li>
                    <li>Work begins immediately</li>
                  </ol>
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground px-2">
                By placing your order, you agree to StudiHire's{" "}
                <span className="underline cursor-pointer">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="underline cursor-pointer">
                  Cancellation Policy
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}