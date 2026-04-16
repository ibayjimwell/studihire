import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Navbar from "@/components/layout/Navbar";
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
  FileText,
  ShieldCheck,
  ArrowUpRight,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  STATUS_DISPLAY_CONFIG,
  TIMELINE_STAGES,
  getTimelineStep,
} from "@/lib/orderStatusConfig";
import { calculateStudentEarning } from "@/utils/studentOrderUtils";

// Map shared config to local format
const STATUS_CONFIG = Object.entries(STATUS_DISPLAY_CONFIG).reduce(
  (acc, [key, config]) => {
    acc[key] = {
      label: config.label,
      color: config.badge,
      dot: config.dotClass,
    };
    return acc;
  },
  {},
);

const TIMELINE_STEPS = TIMELINE_STAGES.slice(1, 5).map((stage, index) => ({
  key: stage.key,
  label: stage.label,
}));

export default function StudentOrderWorkspace() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [activeTab, setActiveTab] = useState("activity");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const bottomRef = useRef(null);

  // Load order data
  useEffect(() => {
    // Dummy order data - order comes in awaiting_payment status
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
        "Create a modern, minimalist logo for a tech startup. Should work well in both color and grayscale. Include multiple concepts.",
      status: "awaiting_payment",
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 1800000).toISOString(),
      payment_id: null,
      approvals: 0,
    };

    setOrder(dummyOrder);
    setMessages([
      {
        id: "msg-1",
        sender_id: "client-001",
        sender_name: "John Doe",
        content:
          "Hi! I need a professional logo for my startup. Attached is our brand brief.",
        message_type: "text",
        created_date: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "msg-2",
        sender_id: "client-001",
        sender_name: "John Doe",
        content:
          "Our budget is ₱3000 and we need it within 5 days. Can you do it?",
        message_type: "text",
        created_date: new Date(Date.now() - 3400000).toISOString(),
      },
    ]);

    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (activeTab === "messages")
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const handleApproveOrder = async () => {
    setActionLoading(true);

    // Simulate payment processing
    const dummyPayment = {
      id: `payment-${Date.now()}`,
      order_id: order.id,
      client_id: order.client_id,
      student_id: order.student_id,
      amount: order.amount,
      platform_fee: order.platform_fee,
      status: "paid",
      created_at: new Date().toISOString(),
    };

    console.log("Payment Processed:", dummyPayment);

    const updatedOrder = {
      ...order,
      status: "pending",
      payment_id: dummyPayment.id,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender_id: "student-001",
        sender_name: "Maria Garcia",
        content:
          "✅ I've approved and accepted this order. Payment has been processed. I'll start working on it right away!",
        message_type: "system",
        created_date: new Date().toISOString(),
      },
    ]);

    console.log("Order Approved:", updatedOrder);
    setOrder(updatedOrder);
    setShowApprovalDialog(false);
    setActionLoading(false);
  };

  const handleStartWork = async () => {
    setActionLoading(true);

    const updatedOrder = { ...order, status: "in_progress" };

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender_id: "student-001",
        sender_name: "Maria Garcia",
        content:
          "🚀 I've started working on your logo. I'll have initial concepts ready soon!",
        message_type: "system",
        created_date: new Date().toISOString(),
      },
    ]);

    console.log("Work Started:", updatedOrder);
    setOrder(updatedOrder);
    setShowStartDialog(false);
    setActionLoading(false);
  };

  const handleDeliverWork = async () => {
    setActionLoading(true);

    if (!deliveryMessage.trim()) {
      setActionLoading(false);
      return;
    }

    const updatedOrder = {
      ...order,
      status: "delivered",
      delivery_message: deliveryMessage,
      delivery_url: deliveryUrl,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender_id: "student-001",
        sender_name: "Maria Garcia",
        content: `📦 **Delivery submitted**\n\n${deliveryMessage}${deliveryUrl ? `\n\n📎 Link: ${deliveryUrl}` : ""}`,
        message_type: "system",
        created_date: new Date().toISOString(),
      },
    ]);

    console.log("Work Delivered:", updatedOrder);
    setOrder(updatedOrder);
    setDeliveryMessage("");
    setDeliveryUrl("");
    setShowDeliveryDialog(false);
    setActionLoading(false);
  };

  const handleSubmitRevision = async () => {
    setActionLoading(true);

    if (!revisionNote.trim()) {
      setActionLoading(false);
      return;
    }

    const updatedOrder = {
      ...order,
      status: "in_progress",
      revisions_count: (order.revisions_count || 0) + 1,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender_id: "student-001",
        sender_name: "Maria Garcia",
        content: `🔄 **Revision submitted**\n\n${revisionNote}`,
        message_type: "system",
        created_date: new Date().toISOString(),
      },
    ]);

    console.log("Revision Submitted:", updatedOrder);
    setOrder(updatedOrder);
    setRevisionNote("");
    setShowRevisionDialog(false);
    setActionLoading(false);
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;

    const message = {
      id: `msg-${Date.now()}`,
      sender_id: "student-001",
      sender_name: "Maria Garcia",
      content: newMsg,
      message_type: "text",
      created_date: new Date().toISOString(),
    };

    console.log("Message Sent:", message);
    setMessages((prev) => [...prev, message]);
    setNewMsg("");
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
  const progress = getTimelineStep(order.status);

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <Link
          to="/student/my-orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

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
                {order.package_name} Package · from{" "}
                <span className="font-semibold text-foreground">
                  {order.client_name}
                </span>
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-1 text-sm text-muted-foreground shrink-0">
              <p>
                Earning:{" "}
                <span className="font-semibold text-foreground text-base">
                  ₱{(order.amount - order.platform_fee).toLocaleString()}
                </span>
              </p>
              <p className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {order.due_date
                  ? `Due ${new Date(order.due_date).toLocaleDateString()}`
                  : "No due date"}
              </p>
            </div>
          </div>

          {/* Timeline progress bar */}
          {order.status !== "awaiting_payment" && (
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
                      className={`text-xs font-medium text-center leading-tight ${
                        i <= progress
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Main workspace */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white border border-border mb-4 p-1 h-auto rounded-xl">
                <TabsTrigger
                  value="activity"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Package className="w-4 h-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> Messages
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="activity" className="space-y-4">
                {/* Requirements */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Project Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {order.requirements}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Package Details */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Package Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Package</span>
                        <span className="font-medium">
                          {order.package_name}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Delivery Time
                        </span>
                        <span className="font-medium">
                          {order.delivery_days} days
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revisions</span>
                        <span className="font-medium">
                          {order.revisions} included
                        </span>
                      </div>
                      <div className="border-t border-border pt-3 flex justify-between">
                        <span className="text-muted-foreground">
                          Your Earning
                        </span>
                        <span className="font-bold text-primary">
                          ₱
                          {(order.amount - order.platform_fee).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status-specific actions */}
                {order.status === "awaiting_payment" && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">
                          Ready to get started?
                        </p>
                        <p className="text-sm text-blue-800">
                          Review the project details and approve to accept this
                          order. Payment will be processed once you approve.
                        </p>
                      </div>
                      <Button
                        className="w-full gap-2"
                        onClick={() => setShowApprovalDialog(true)}
                      >
                        <ThumbsUp className="w-4 h-4" /> Approve & Accept Order
                      </Button>
                      <Button variant="outline" className="w-full gap-2">
                        <ThumbsDown className="w-4 h-4" /> Decline Order
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {order.status === "pending" && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-green-900 mb-3">
                        ✅ Order approved! Payment has been processed and is
                        held in escrow.
                      </p>
                      <Button
                        className="w-full gap-2"
                        onClick={() => setShowStartDialog(true)}
                      >
                        <ArrowUpRight className="w-4 h-4" /> Start Working
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {order.status === "in_progress" && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-amber-900 mb-3">
                        🚀 Work in progress! When you're ready to submit, click
                        deliver below.
                      </p>
                      <Button
                        className="w-full gap-2"
                        onClick={() => setShowDeliveryDialog(true)}
                      >
                        <Package className="w-4 h-4" /> Submit Deliverables
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {order.status === "delivered" && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-purple-900">
                        ✉️ Work delivered! Waiting for client review...
                      </p>
                    </CardContent>
                  </Card>
                )}

                {order.status === "revision_requested" && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4 space-y-4">
                      <p className="text-sm text-orange-900">
                        🔄 Client requested revisions. Please review their
                        feedback in messages.
                      </p>
                      <Button
                        className="w-full gap-2"
                        onClick={() => setShowRevisionDialog(true)}
                      >
                        <RefreshCw className="w-4 h-4" /> Submit Revision
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-4">
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${
                            msg.sender_id === "student-001"
                              ? "flex-row-reverse"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              msg.sender_id === "student-001"
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {msg.sender_name?.[0]}
                          </div>
                          <div
                            className={`flex-1 min-w-0 ${
                              msg.sender_id === "student-001"
                                ? "text-right"
                                : ""
                            }`}
                          >
                            <p className="text-xs font-semibold text-muted-foreground">
                              {msg.sender_name}
                            </p>
                            <div
                              className={`mt-1 p-3 rounded-lg inline-block ${
                                msg.sender_id === "student-001"
                                  ? "bg-primary text-white"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(msg.created_date).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>

                    {/* Message input */}
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Input
                        placeholder="Type a message..."
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button size="icon" onClick={sendMessage}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-3">
              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Client Info
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Client Name
                      </p>
                      <p className="font-semibold text-foreground">
                        {order.client_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Order Value
                      </p>
                      <p className="text-lg font-bold text-primary">
                        ₱{order.amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your earn: ₱
                        {(order.amount - order.platform_fee).toLocaleString()}
                      </p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Platform Fee
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        ₱{order.platform_fee?.toLocaleString()} (10%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-green-900">
                        Protected by StudiHire
                      </p>
                      <p className="text-green-800 text-xs mt-0.5">
                        Your payment is held safely until you deliver and client
                        approves.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Order?</DialogTitle>
            <DialogDescription>
              By approving, you accept this order and commit to delivering the
              work within {order.delivery_days} days. Payment will be processed
              immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-2">Order Summary:</p>
              <div className="space-y-1 text-blue-800">
                <div className="flex justify-between">
                  <span>Total Value:</span>
                  <span className="font-semibold">
                    ₱{order.amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (10%):</span>
                  <span>-₱{order.platform_fee?.toLocaleString()}</span>
                </div>
                <div className="border-t border-blue-200 pt-1 mt-1 flex justify-between">
                  <span className="font-bold">Your Earning:</span>
                  <span className="font-bold">
                    ₱{(order.amount - order.platform_fee).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleApproveOrder} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 mr-2" /> Approve & Accept
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Work Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Working</DialogTitle>
            <DialogDescription>
              Confirm that you're ready to start working on this project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Once you start, the{" "}
              <span className="font-semibold text-foreground">
                {order.delivery_days}-day clock
              </span>{" "}
              begins. Make sure you're ready to complete the work on time.
            </p>
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3 text-sm text-amber-800">
                <p className="font-semibold mb-1">⏰ Due Date:</p>
                <p>{new Date(order.due_date).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStartDialog(false)}
              disabled={actionLoading}
            >
              Not Yet
            </Button>
            <Button onClick={handleStartWork} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 mr-2" /> Start Working
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Deliverables</DialogTitle>
            <DialogDescription>
              Share your completed work with the client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold block mb-2">
                Delivery Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Describe what you've delivered and any important notes for the client..."
                rows={4}
                value={deliveryMessage}
                onChange={(e) => setDeliveryMessage(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">
                File/Link URL (Optional)
              </label>
              <Input
                placeholder="https://drive.google.com/... or your delivery link"
                value={deliveryUrl}
                onChange={(e) => setDeliveryUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeliveryDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeliverWork}
              disabled={actionLoading || !deliveryMessage.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Submitting...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" /> Submit Delivery
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Revision</DialogTitle>
            <DialogDescription>
              Upload your revised work based on client feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold block mb-2">
                Revision Notes <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Describe the changes you've made based on feedback..."
                rows={4}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">
                File/Link URL (Optional)
              </label>
              <Input placeholder="https://drive.google.com/... or your revised file link" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevisionDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRevision}
              disabled={actionLoading || !revisionNote.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Submitting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" /> Submit Revision
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
