import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navbar from "@/components/layout/Navbar";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  Clock,
  CheckCircle,
  Send,
  Package,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Star,
  Loader2,
  ExternalLink,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  CircleDot,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  awaiting_payment: {
    label: "Awaiting Payment",
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  revision_requested: {
    label: "Revision Requested",
    color: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
  delivered: {
    label: "Delivered",
    color: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-600",
    dot: "bg-red-400",
  },
  disputed: {
    label: "Disputed",
    color: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};

const TIMELINE_STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "in_progress", label: "Work Started" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

function getTimelineProgress(status) {
  if (status === "awaiting_payment") return 0;
  if (status === "pending") return 1;
  if (status === "in_progress" || status === "revision_requested") return 2;
  if (status === "delivered") return 3;
  if (status === "completed") return 4;
  return 1;
}

export default function OrderWorkspace() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useCurrentUser();

  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showSuccess, setShowSuccess] = useState(
    searchParams.get("order") === "placed",
  );
  const [activeTab, setActiveTab] = useState("activity");
  const bottomRef = useRef(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  useEffect(() => {
    if (!conversation) return;
    // Dummy messages
    const dummyMessages = [
      {
        id: "msg-1",
        conversation_id: conversation.id,
        sender_id: conversation.participant_ids?.[0],
        sender_name: conversation.participant_names?.[0],
        content:
          "Hi! I'm excited to work on your project. I'll start right away!",
        message_type: "text",
        created_date: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "msg-2",
        conversation_id: conversation.id,
        sender_id: conversation.participant_ids?.[1],
        sender_name: conversation.participant_names?.[1],
        content: "Sounds great! Looking forward to seeing your work.",
        message_type: "text",
        created_date: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
    setMessages(dummyMessages);
  }, [conversation?.id]);

  useEffect(() => {
    if (activeTab === "messages")
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const loadOrder = async () => {
    // Dummy order data - starts with awaiting_payment status
    const dummyOrder = {
      id: id,
      gig_id: "gig-001",
      gig_title: "Professional Logo Design",
      client_id: "client-001",
      client_name: "John Doe",
      student_id: "student-001",
      student_name: "Maria Garcia",
      package_name: "Standard",
      package_index: 1,
      amount: 3000,
      platform_fee: 300,
      delivery_days: 5,
      revisions: 3,
      requirements:
        "Create a modern, minimalist logo for a tech startup. Should work well in both color and grayscale.",
      status: "awaiting_payment",
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 1800000).toISOString(),
      payment_id: null,
    };

    const dummyConversation = {
      id: `conv-${id}`,
      participant_ids: [dummyOrder.client_id, dummyOrder.student_id],
      participant_names: [dummyOrder.client_name, dummyOrder.student_name],
      related_gig_id: dummyOrder.gig_id,
      last_message: "Looking forward to seeing your work.",
      status: "active",
    };

    setOrder(dummyOrder);
    setConversation(dummyConversation);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !conversation || !user) return;
    const content = newMsg.trim();

    // Dummy message creation
    const dummyMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: user?.id || "client-001",
      sender_name: user?.full_name || "User",
      content,
      message_type: "text",
      created_date: new Date().toISOString(),
    };

    console.log("Dummy Message Created:", dummyMessage);
    setMessages((prev) => [...prev, dummyMessage]);
    setNewMsg("");
  };

  const isClient = user?.id === order?.client_id;
  const isStudent = user?.id === order?.student_id;

  const updateOrderStatus = async (status, extra = {}) => {
    setActionLoading(true);

    // If transitioning to in_progress from awaiting_payment, process payment first
    if (status === "in_progress" && order.status === "awaiting_payment") {
      console.log("Processing payment before starting work...");

      // Simulate payment processing
      const dummyPayment = {
        id: `payment-${Date.now()}`,
        order_id: order.id,
        client_id: order.client_id,
        student_id: order.student_id,
        gig_id: order.gig_id,
        amount: order.amount,
        platform_fee: order.platform_fee,
        net_amount: order.amount - order.platform_fee,
        currency: "PHP",
        status: "paid",
        description: `${order.gig_title} — ${order.package_name}`,
        created_at: new Date().toISOString(),
      };

      console.log("Dummy Payment Processed:", dummyPayment);

      // Update order with payment_id
      extra.payment_id = dummyPayment.id;

      // Show a system message that payment was processed
      if (order) {
        const dummyPaymentMsg = {
          id: `msg-${Date.now()}`,
          conversation_id: `conv-${order.id}`,
          sender_id: "system",
          sender_name: "StudiHire",
          content: `💳 **Payment Confirmed** - ₱${order.amount.toLocaleString()} has been charged and is held in escrow. Work can now begin!`,
          message_type: "system",
          created_date: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, dummyPaymentMsg]);
      }
    }

    // Dummy status update
    const notifyId = isClient ? order.student_id : order.client_id;
    const notifMap = {
      in_progress: {
        title:
          status === "in_progress" && order.status === "awaiting_payment"
            ? "💳 Payment Confirmed & Work Started!"
            : "🚀 Work Started!",
        body: `${user?.full_name || "User"} has started your order.`,
      },
      delivered: {
        title: "📦 Order Delivered!",
        body: `${user?.full_name || "User"} delivered your order. Please review.`,
      },
      revision_requested: {
        title: "🔄 Revision Requested",
        body: `${user?.full_name || "User"} requested changes.`,
      },
      completed: {
        title: "✅ Order Completed!",
        body: `Payment released to ${user?.full_name || "User"}.`,
      },
      cancelled: {
        title: "❌ Order Cancelled",
        body: "Your order was cancelled.",
      },
    };

    const updatedOrder = { ...order, status, ...extra };
    console.log("Order Status Updated:", updatedOrder);

    if (notifMap[status]) {
      const dummyNotif = {
        id: `notif-${Date.now()}`,
        user_id: notifyId,
        type: "gig_order",
        ...notifMap[status],
        link: `/order/${order.id}`,
        is_read: false,
      };
      console.log("Dummy Notification Created:", dummyNotif);
    }

    if (status === "completed" && order.payment_id) {
      const dummyPaymentUpdate = {
        id: order.payment_id,
        status: "released",
        released_at: new Date().toISOString(),
      };
      console.log("Dummy Payment Released:", dummyPaymentUpdate);
    }

    setOrder(updatedOrder);
    setActionLoading(false);
  };

  const handleDeliver = async () => {
    if (!deliveryMessage.trim()) return;
    await updateOrderStatus("delivered", {
      delivery_message: deliveryMessage,
      delivery_url: deliveryUrl,
    });
    if (conversation) {
      const dummyDeliveryMsg = {
        id: `msg-${Date.now()}`,
        conversation_id: conversation.id,
        sender_id: user?.id || "student-001",
        sender_name: user?.full_name || "Student",
        content: `📦 **Delivery submitted.** ${deliveryMessage}${deliveryUrl ? `\n\nLink: ${deliveryUrl}` : ""}`,
        message_type: "system",
        created_date: new Date().toISOString(),
      };
      console.log("Dummy Delivery Message Created:", dummyDeliveryMsg);
      setMessages((prev) => [...prev, dummyDeliveryMsg]);
    }
    setDeliveryMessage("");
    setDeliveryUrl("");
    setActiveTab("activity");
  };

  const handleRevision = async () => {
    if (!revisionNote.trim()) return;
    await updateOrderStatus("revision_requested", {
      revision_note: revisionNote,
    });
    if (conversation) {
      const dummyRevisionMsg = {
        id: `msg-${Date.now()}`,
        conversation_id: conversation.id,
        sender_id: user?.id || "client-001",
        sender_name: user?.full_name || "Client",
        content: `🔄 **Revision requested:** ${revisionNote}`,
        message_type: "system",
        created_date: new Date().toISOString(),
      };
      console.log("Dummy Revision Message Created:", dummyRevisionMsg);
      setMessages((prev) => [...prev, dummyRevisionMsg]);
    }
    setRevisionNote("");
  };

  const handleComplete = async () => {
    await updateOrderStatus("completed", {
      completed_at: new Date().toISOString(),
    });
    if (reviewComment.trim()) {
      const dummyReview = {
        id: `review-${Date.now()}`,
        reviewer_id: user?.id || "client-001",
        reviewee_id: order.student_id,
        gig_id: order.gig_id,
        rating: reviewRating,
        comment: reviewComment,
        reviewer_role: "client",
        is_public: true,
        created_at: new Date().toISOString(),
      };
      console.log("Dummy Review Created:", dummyReview);
    }
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

  if (!order)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-20 text-muted-foreground">
          Order not found.
        </div>
      </div>
    );

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const progress = getTimelineProgress(order.status);

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Success banner */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-800 text-sm">
                Order placed successfully! 🎉
              </p>
              <p className="text-green-700 text-xs mt-0.5">
                Your order has been placed. Payment will be processed when the
                student approves and starts working on your order.
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-green-500 hover:text-green-700 text-xl leading-none shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* Order header */}
        <div className="bg-white border border-border rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                  />
                  {statusCfg.label}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  #{order.id?.slice(-8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-lg font-bold text-foreground leading-snug">
                {order.gig_title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {order.package_name} Package ·
                <span className="font-semibold text-foreground">
                  {" "}
                  ₱{order.amount?.toLocaleString()}
                </span>
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-1 text-sm text-muted-foreground shrink-0">
              <p>
                {isClient ? "Freelancer" : "Client"}:{" "}
                <span className="font-semibold text-foreground">
                  {isClient ? order.student_name : order.client_name}
                </span>
              </p>
              <p className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {order.due_date
                  ? `Due ${format(new Date(order.due_date), "MMM d, yyyy")}`
                  : "No due date"}
              </p>
            </div>
          </div>

          {/* Timeline progress bar */}
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-border -z-0" />
              <div
                className="absolute left-0 top-3.5 h-0.5 bg-primary transition-all duration-500 -z-0"
                style={{ width: `${Math.min((progress / 4) * 100, 100)}%` }}
              />
              {TIMELINE_STEPS.map((t, i) => (
                <div
                  key={t.key}
                  className="flex flex-col items-center gap-1.5 z-10 flex-1"
                >
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                      i < progress
                        ? "bg-primary border-primary text-white"
                        : i === progress
                          ? "bg-white border-primary text-primary"
                          : "bg-white border-muted-foreground/30 text-muted-foreground/40"
                    }`}
                  >
                    {i < progress ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center leading-tight ${i <= progress ? "text-foreground" : "text-muted-foreground/50"}`}
                  >
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Workspace tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white border border-border mb-4 p-1 h-auto rounded-xl">
                <TabsTrigger
                  value="activity"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white flex gap-1.5"
                >
                  <Package className="w-4 h-4" /> Activity
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white flex gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" /> Messages
                </TabsTrigger>
                <TabsTrigger
                  value="requirements"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white flex gap-1.5"
                >
                  <FileText className="w-4 h-4" /> Brief
                </TabsTrigger>
              </TabsList>

              {/* Activity */}
              <TabsContent value="activity" className="space-y-4">
                {/* Student: Accept order */}
                {isStudent && order.status === "pending" && (
                  <Card className="border-blue-200 bg-blue-50/70">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900">
                            New order from {order.client_name}!
                          </p>
                          <p className="text-sm text-blue-700 mt-0.5 mb-4">
                            Review the requirements and start working when
                            ready. Delivery due in {order.delivery_days} days.
                          </p>
                          <Button
                            className="gradient-primary text-white border-0 gap-2"
                            onClick={() => updateOrderStatus("in_progress")}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                            Accept & Start Working
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Student: Submit delivery */}
                {isStudent &&
                  (order.status === "in_progress" ||
                    order.status === "revision_requested") && (
                    <Card className="border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Send className="w-4 h-4 text-primary" /> Submit Your
                          Delivery
                          {order.status === "revision_requested" && (
                            <span className="text-xs font-normal text-orange-600 ml-1">
                              (Revision requested)
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {order.status === "revision_requested" &&
                          order.revision_note && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                              <p className="font-semibold text-orange-800 mb-1">
                                Client's revision notes:
                              </p>
                              <p className="text-orange-700">
                                {order.revision_note}
                              </p>
                            </div>
                          )}
                        <Textarea
                          placeholder="Describe what you've completed and delivered. Include any notes for the client..."
                          rows={4}
                          value={deliveryMessage}
                          onChange={(e) => setDeliveryMessage(e.target.value)}
                        />
                        <Input
                          placeholder="Link to deliverable — Google Drive, Figma, GitHub, etc. (optional)"
                          value={deliveryUrl}
                          onChange={(e) => setDeliveryUrl(e.target.value)}
                        />
                        <Button
                          className="gradient-primary text-white border-0 gap-2 w-full"
                          onClick={handleDeliver}
                          disabled={actionLoading || !deliveryMessage.trim()}
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Submit Delivery
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                {/* Client: Review delivery */}
                {isClient && order.status === "delivered" && (
                  <div className="space-y-4">
                    {/* Delivery card */}
                    <Card className="border-purple-200 bg-purple-50/60">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-purple-900 text-sm">
                              Delivery Received!
                            </p>
                            <p className="text-xs text-purple-600">
                              {order.student_name} submitted a delivery
                            </p>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-purple-100 text-sm">
                          <p className="text-foreground/80 whitespace-pre-wrap">
                            {order.delivery_message}
                          </p>
                          {order.delivery_url && (
                            <a
                              href={order.delivery_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-3 text-primary font-medium text-xs hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open
                              Deliverable
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Request revision */}
                      <Card className="border-border">
                        <CardContent className="p-4 space-y-3">
                          <p className="font-semibold text-sm flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-orange-500" />{" "}
                            Request Revision
                          </p>
                          <Textarea
                            placeholder="What needs to be changed? Be specific..."
                            rows={3}
                            value={revisionNote}
                            onChange={(e) => setRevisionNote(e.target.value)}
                          />
                          <Button
                            variant="outline"
                            className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 gap-2"
                            onClick={handleRevision}
                            disabled={actionLoading || !revisionNote.trim()}
                          >
                            <RefreshCw className="w-4 h-4" /> Request Revision (
                            {order.revisions} left)
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Accept & complete */}
                      <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="p-4 space-y-3">
                          <p className="font-semibold text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />{" "}
                            Accept Delivery
                          </p>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">
                              Rate your experience
                            </p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setReviewRating(s)}
                                >
                                  <Star
                                    className={`w-6 h-6 transition-all ${s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 hover:text-yellow-300"}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <Textarea
                            placeholder="Leave a public review for this student (optional)..."
                            rows={3}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                          />
                          <Button
                            className="w-full gradient-primary text-white border-0 gap-2"
                            onClick={handleComplete}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve & Release Payment
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            ₱{order.amount?.toLocaleString()} will be released
                            to {order.student_name}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Completed state */}
                {order.status === "completed" && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-lg font-bold text-green-900">
                        Order Completed! 🎉
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {isClient
                          ? `₱${order.amount?.toLocaleString()} released to ${order.student_name}.`
                          : `₱${(order.amount * 0.9)?.toFixed(0)} has been added to your earnings.`}
                      </p>
                      {order.completed_at && (
                        <p className="text-xs text-green-600 mt-1">
                          Completed{" "}
                          {formatDistanceToNow(new Date(order.completed_at), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* In progress state for client */}
                {isClient && order.status === "in_progress" && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <CircleDot className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 text-sm">
                          {order.student_name} is working on your order
                        </p>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Expected delivery by{" "}
                          {order.due_date
                            ? format(new Date(order.due_date), "MMMM d, yyyy")
                            : "—"}
                          . You'll be notified when it's ready.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Student in progress tip */}
                {isStudent && order.status === "in_progress" && (
                  <Card className="border-border bg-muted/30">
                    <CardContent className="p-4 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">
                          Keep the client updated
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Send progress updates via the Messages tab. Deliver
                          before the due date to maintain a high rating.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Messages */}
              <TabsContent value="messages">
                <Card className="border-border">
                  <div className="flex flex-col" style={{ height: "480px" }}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageSquare className="w-10 h-10 text-muted-foreground/20 mb-3" />
                          <p className="text-sm font-medium text-muted-foreground">
                            No messages yet
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Start the conversation with{" "}
                            {isClient ? order.student_name : order.client_name}
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMe = msg.sender_id === user?.id;
                          if (msg.message_type === "system")
                            return (
                              <div
                                key={msg.id}
                                className="flex justify-center py-1"
                              >
                                <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full max-w-xs text-center">
                                  {msg.content}
                                </span>
                              </div>
                            );
                          return (
                            <div
                              key={msg.id}
                              className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                            >
                              <Avatar className="w-7 h-7 shrink-0">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                  {msg.sender_name?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}
                              >
                                <div
                                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                    isMe
                                      ? "bg-primary text-primary-foreground rounded-br-sm"
                                      : "bg-white border border-border text-foreground rounded-bl-sm shadow-sm"
                                  }`}
                                >
                                  {msg.content}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 px-1">
                                  {msg.created_date
                                    ? format(
                                        new Date(msg.created_date),
                                        "h:mm a",
                                      )
                                    : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={bottomRef} />
                    </div>
                    <div className="p-3 border-t border-border bg-white/50">
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Message ${isClient ? order.student_name : order.client_name}...`}
                          value={newMsg}
                          onChange={(e) => setNewMsg(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            (e.preventDefault(), sendMessage())
                          }
                          className="bg-white"
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!newMsg.trim()}
                          className="gradient-primary text-white border-0 shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Requirements */}
              <TabsContent value="requirements">
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Project
                      Brief from {order.client_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/40 rounded-xl p-4 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                      {order.requirements || (
                        <span className="text-muted-foreground italic">
                          No requirements provided.
                        </span>
                      )}
                    </div>
                    {order.revision_note && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <p className="font-semibold text-orange-800 text-sm flex items-center gap-1.5 mb-2">
                          <RefreshCw className="w-4 h-4" /> Latest Revision
                          Request
                        </p>
                        <p className="text-sm text-orange-700">
                          {order.revision_note}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Order details */}
            <Card className="border-border">
              <CardContent className="p-4 space-y-3 text-sm">
                <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  Order Details
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-primary text-base">
                    ₱{order.amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium">
                    {order.delivery_days} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revisions</span>
                  <span className="font-medium">{order.revisions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due date</span>
                  <span className="font-medium">
                    {order.due_date
                      ? format(new Date(order.due_date), "MMM d")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Escrow info */}
            {!["completed", "cancelled", "disputed"].includes(order.status) && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-start gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">
                      Funds in Escrow
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ₱{order.amount?.toLocaleString()} is held securely and
                      will be released once you approve the delivery.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cancel */}
            {["pending", "in_progress"].includes(order.status) && (
              <Card className="border-red-100">
                <CardContent className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2"
                    onClick={() => updateOrderStatus("cancelled")}
                    disabled={actionLoading}
                  >
                    <AlertTriangle className="w-4 h-4" /> Cancel Order
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Mutual cancellations may affect your account standing.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
