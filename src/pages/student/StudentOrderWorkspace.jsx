// @ts-nocheck
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
import { useToast } from "@/components/ui/use-toast";
import supabase from "@/lib/supabaseClient";
import Navbar from "@/components/layout/Navbar";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { orderGetById, orderUpdateStatus } from "@/api/orderApi";
import { paymentCreate, paymentGetByOrder } from "@/api/paymentApi";
import { deliveryGetLatest, deliverySubmit } from "@/api/deliveryApi";
import { reviewGetByOrder } from "@/api/reviewApi";
import { chatGetMessages, chatSendMessage, chatStartConversation } from "@/api/chatApi";
import {
  Clock,
  CheckCircle,
  Send,
  Package,
  MessageSquare,
  RefreshCw,
  Star,
  Loader2,
  ShieldCheck,
  ArrowUpRight,
  ArrowLeft,
  ThumbsUp,
} from "lucide-react";
import {
  STATUS_DISPLAY_CONFIG,
  getTimelineStep,
} from "@/lib/orderStatusConfig";
import { format, formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = Object.entries(STATUS_DISPLAY_CONFIG).reduce((acc, [key, config]) => {
  acc[key] = { label: config.label, color: config.badge, dot: config.dotClass };
  return acc;
}, {});

const TIMELINE_STEPS = [
  { key: "order_placed", label: "Order Placed" },
  { key: "work_started", label: "Work Started" },
  { key: "work_delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

export default function StudentOrderWorkspace() {
  const { id } = useParams();
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [payment, setPayment] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [activeTab, setActiveTab] = useState("activity");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [revisionNote, setRevisionNote] = useState("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { loadOrder(); }, [id]);

  useEffect(() => {
    if (!conversation?.id) return;
    const sub = supabase?.channel(`messages:${conversation.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();
    return () => { if (sub) supabase?.removeChannel(sub); };
  }, [conversation?.id]);

  useEffect(() => {
    if (activeTab === "messages") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const loadOrder = async () => {
    setLoading(true);
    const { order: orderData, error: orderErr } = await orderGetById(id);
    if (orderErr || !orderData) {
      setLoading(false);
      return;
    }
    setOrder(orderData);

    // Load payment
    const { payment: paymentData } = await paymentGetByOrder(id);
    setPayment(paymentData);

    // Load delivery
    const { delivery: deliveryData } = await deliveryGetLatest(id);
    setDelivery(deliveryData);

    // Load review
    const { review: reviewData } = await reviewGetByOrder(id);
    setExistingReview(reviewData);

    // Start or find conversation
    const otherUserId = orderData.client_id;
    const { conversation: conv } = await chatStartConversation({
      otherUserId,
      otherName: orderData.client_name,
      otherRole: "client",
      gigId: orderData.gig_id,
      gigTitle: orderData.gig_title,
      orderId: orderData.id,
    });
    setConversation(conv);

    // Load messages
    if (conv) {
      const { messages: msgs } = await chatGetMessages(conv.id, { limit: 100 });
      setMessages(msgs);
    }

    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !conversation || !user) return;
    const { message, error } = await chatSendMessage(conversation.id, newMsg.trim());
    if (!error && message) setMessages((prev) => [...prev, message]);
    setNewMsg("");
  };

  // 1. Approve Order → Create payment → Set to pending
  const handleApproveOrder = async () => {
    setActionLoading(true);

    const { payment: paymentData, error: payErr } = await paymentCreate({
      order_id: id,
      client_id: order.client_id,
      student_id: order.student_id,
      amount: order.amount,
      fee_pct: 10,
    });

    if (payErr) {
      toast({ title: "Payment Error", description: payErr.message, variant: "destructive" });
      setActionLoading(false);
      return;
    }
    setPayment(paymentData);

    await chatSendMessage(conversation?.id, `✅ **Order approved!** ₱${Number(order.amount).toLocaleString()} held in escrow.`);

    const { order: updated } = await orderUpdateStatus(id, "pending");
    setOrder(updated);
    setShowApprovalDialog(false);
    toast({ title: "Order approved! 🎉" });
    setActionLoading(false);
  };

  // 2. Start Working → Set to in_progress
  const handleStartWork = async () => {
    setActionLoading(true);
    await chatSendMessage(conversation?.id, "🚀 **Work started!** I'm now working on your project.");
    const { order: updated } = await orderUpdateStatus(id, "in_progress");
    setOrder(updated);
    toast({ title: "Work started! 🚀" });
    setActionLoading(false);
  };

  // 3. Deliver Work
  const handleDeliverWork = async () => {
    if (!deliveryMessage.trim()) return;
    setActionLoading(true);

    const { delivery: deliveryData, error: delErr } = await deliverySubmit({
      order_id: id,
      student_id: user.id,
      message: deliveryMessage,
      files: deliveryFiles,
    });

    if (delErr) {
      toast({ title: "Delivery Error", description: delErr.message, variant: "destructive" });
      setActionLoading(false);
      return;
    }
    setDelivery(deliveryData);

    await chatSendMessage(conversation?.id, `📦 **Delivery submitted:** ${deliveryMessage}${deliveryUrl ? `\nLink: ${deliveryUrl}` : ""}`);

    const { order: updated } = await orderUpdateStatus(id, "delivered");
    setOrder(updated);
    setDeliveryMessage("");
    setDeliveryUrl("");
    setShowDeliveryDialog(false);
    toast({ title: "Delivery submitted! 🎉" });
    setActionLoading(false);
  };

  // 4. Submit Revision
  const handleSubmitRevision = async () => {
    if (!revisionNote.trim()) return;
    setActionLoading(true);

    await chatSendMessage(conversation?.id, `🔄 **Revision submitted:** ${revisionNote}`);

    const { order: updated } = await orderUpdateStatus(id, "in_progress");
    setOrder({ ...updated, revision_note: revisionNote });
    setRevisionNote("");
    setShowRevisionDialog(false);
    toast({ title: "Revision submitted" });
    setActionLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="text-center py-20 text-muted-foreground">Order not found.</div>
    </div>
  );

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const progress = getTimelineStep(order.status);

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link to="/student/my-orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        {/* Order header */}
        <div className="bg-white border border-border rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
                <span className="text-xs text-muted-foreground font-mono">#{order.id?.slice(-8).toUpperCase()}</span>
              </div>
              <h1 className="text-lg font-bold text-foreground leading-snug">{order.gig_title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {order.package_name} Package · from <span className="font-semibold text-foreground">{order.client_name}</span>
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-1 text-sm text-muted-foreground shrink-0">
              <p>
                Earning:{" "}
                <span className="font-semibold text-foreground text-base">
                  ₱{Math.round(Number(order.amount) * 0.9).toLocaleString()}
                </span>
              </p>
              <p className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {order.due_date ? `Due ${format(new Date(order.due_date), "MMM d, yyyy")}` : "No due date"}
              </p>
            </div>
          </div>

          {/* Timeline */}
          {order.status !== "awaiting_payment" && (
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-border -z-0" />
                <div className="absolute left-0 top-3.5 h-0.5 bg-primary transition-all duration-500 -z-0" style={{ width: `${Math.min((progress / 4) * 100, 100)}%` }} />
                {TIMELINE_STEPS.map((t, i) => (
                  <div key={t.key} className="flex flex-col items-center gap-1.5 z-10 flex-1">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${i < progress ? "bg-primary border-primary text-white" : i === progress ? "bg-white border-primary text-primary" : "bg-white border-muted-foreground/30 text-muted-foreground/40"}`}>
                      {i < progress ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium text-center leading-tight ${i <= progress ? "text-foreground" : "text-muted-foreground/50"}`}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white border border-border mb-4 p-1 h-auto rounded-xl">
                <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"><Package className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
                <TabsTrigger value="messages" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"><MessageSquare className="w-4 h-4 mr-2" /> Messages</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-4">
                {/* Requirements */}
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base">Project Requirements</CardTitle></CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{order.requirements || "No requirements provided."}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Package Details */}
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base">Package Details</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Package</span><span className="font-medium">{order.package_name}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery Time</span><span className="font-medium">{order.delivery_days} days</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Revisions</span><span className="font-medium">{order.revisions} included</span></div>
                      <div className="border-t border-border pt-3 flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-bold text-primary">₱{Number(order.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Platform Fee (10%)</span>
                        <span className="font-medium">-₱{Math.round(Number(order.amount) * 0.1).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-border pt-3 flex justify-between">
                        <span className="font-semibold">Your Earning</span>
                        <span className="font-bold text-primary">₱{Math.round(Number(order.amount) * 0.9).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment status */}
                {payment && (
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Payment Status</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${payment.status === "released" ? "bg-green-100 text-green-700" : payment.status === "held" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"}`}>
                          {payment.status === "released" ? "Released ✓" : payment.status === "held" ? "In Escrow" : "Pending"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AWAITING_PAYMENT: Approve order */}
                {order.status === "awaiting_payment" && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">Ready to get started?</p>
                        <p className="text-sm text-blue-800">Review the project details and approve to accept this order. A simulated payment of ₱{Number(order.amount).toLocaleString()} will be held in escrow.</p>
                      </div>
                      <Button className="w-full gap-2" onClick={() => setShowApprovalDialog(true)}>
                        <ThumbsUp className="w-4 h-4" /> Simulate Payment & Approve
                      </Button>
                      <p className="text-xs text-blue-600 text-center">💰 Fake payment — no real charge</p>
                    </CardContent>
                  </Card>
                )}

                {/* PENDING: Start working */}
                {order.status === "pending" && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-green-900 mb-3">✅ Order approved! Payment held in escrow.</p>
                      <Button className="w-full gap-2" onClick={handleStartWork} disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                        Start Working
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* IN_PROGRESS / REVISION: Submit delivery */}
                {(order.status === "in_progress" || order.status === "revision_requested") && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-amber-900 mb-3">
                        {order.status === "revision_requested" ? "🔄 Client requested revisions." : "🚀 Work in progress!"}
                      </p>
                      <Button className="w-full gap-2" onClick={() => setShowDeliveryDialog(true)}>
                        <Package className="w-4 h-4" /> Submit Deliverables
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* DELIVERED: Waiting for client */}
                {order.status === "delivered" && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-purple-900">✉️ Work delivered! Waiting for client review...</p>
                      {delivery?.message && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-purple-100 text-sm">
                          <p className="font-semibold text-xs text-muted-foreground mb-1">Your delivery message:</p>
                          <p className="text-foreground/80 whitespace-pre-wrap">{delivery.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* COMPLETED */}
                {order.status === "completed" && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle className="w-8 h-8 text-green-600" /></div>
                      <p className="text-lg font-bold text-green-900">Order Completed! 🎉</p>
                      <p className="text-sm text-green-700 mt-1">₱{Math.round(Number(order.amount) * 0.9).toLocaleString()} added to your earnings (10% platform fee deducted).</p>
                      {existingReview && (
                        <div className="mt-3">
                          <div className="flex items-center justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-5 h-5 ${s <= existingReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                          {existingReview.comment && <p className="text-xs text-green-700 mt-1">"{existingReview.comment}"</p>}
                        </div>
                      )}
                      {order.completed_at && (
                        <p className="text-xs text-green-600 mt-1">Completed {formatDistanceToNow(new Date(order.completed_at), { addSuffix: true })}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Revision note display */}
                {order.revision_note && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-3">
                      <p className="font-semibold text-orange-800 text-xs mb-1">Client's revision note:</p>
                      <p className="text-sm text-orange-700">{order.revision_note}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Messages */}
              <TabsContent value="messages" className="space-y-4">
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                      {messages.length === 0 ? (
                        <div className="text-center py-10">
                          <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No messages yet</p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMe = msg.sender_id === user?.id;
                          return (
                            <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                {msg.sender_name?.[0] || "?"}
                              </div>
                              <div className={`flex-1 min-w-0 ${isMe ? "text-right" : ""}`}>
                                <p className="text-xs font-semibold text-muted-foreground">{msg.sender_name}</p>
                                <div className={`mt-1 p-3 rounded-lg inline-block max-w-[80%] text-left ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {msg.created_at ? format(new Date(msg.created_at), "h:mm a") : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={bottomRef} />
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Input placeholder="Type a message..." value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                      <Button size="icon" onClick={sendMessage} disabled={!newMsg.trim()}><Send className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Client Info</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Client Name</p>
                    <p className="font-semibold text-foreground">{order.client_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Order Value</p>
                    <p className="text-lg font-bold text-primary">₱{Number(order.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">You earn: ₱{Math.round(Number(order.amount) * 0.9).toLocaleString()}</p>
                  </div>
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Platform Fee</p>
                    <p className="text-sm font-medium text-muted-foreground">₱{Math.round(Number(order.amount) * 0.1).toLocaleString()} (10%)</p>
                  </div>
                  {payment && (
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground mb-1">Payment</p>
                      <p className={`text-sm font-semibold ${payment.status === "released" ? "text-green-600" : "text-yellow-600"}`}>
                        {payment.status === "released" ? "Released ✓" : "In Escrow"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-green-900">Protected by StudiHire</p>
                    <p className="text-green-800 text-xs mt-0.5">Your payment is held safely until you deliver and client approves.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Order?</DialogTitle>
            <DialogDescription>
              By approving, you accept this order and commit to delivering within {order.delivery_days} days. Payment simulation will run.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-2">Order Summary:</p>
              <div className="space-y-1 text-blue-800">
                <div className="flex justify-between"><span>Total Value:</span><span className="font-semibold">₱{Number(order.amount).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Platform Fee (10%):</span><span>-₱{Math.round(Number(order.amount) * 0.1).toLocaleString()}</span></div>
                <div className="border-t border-blue-200 pt-1 mt-1 flex justify-between"><span className="font-bold">Your Earning:</span><span className="font-bold">₱{Math.round(Number(order.amount) * 0.9).toLocaleString()}</span></div>
              </div>
            </div>
            <p className="text-xs text-blue-600 text-center">💰 Fake payment simulation. No real gateway integration.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleApproveOrder} disabled={actionLoading}>
              {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <><ThumbsUp className="w-4 h-4 mr-2" /> Approve & Accept</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Deliverables</DialogTitle>
            <DialogDescription>Share your completed work with the client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Delivery Message <span className="text-red-500">*</span></label>
              <Textarea placeholder="Describe what you've delivered..." rows={4} value={deliveryMessage} onChange={(e) => setDeliveryMessage(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">File/Link (Optional)</label>
              <Input placeholder="https://drive.google.com/..." value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Upload Files (Optional)</label>
              <Input type="file" multiple className="text-sm" onChange={(e) => setDeliveryFiles(Array.from(e.target.files || []))} />
            </div>
            {order.status === "revision_requested" && order.revision_note && (
              <div className="p-3 bg-orange-50 rounded-lg text-sm">
                <p className="font-semibold text-orange-800 mb-1">Client's revision note:</p>
                <p className="text-orange-700">{order.revision_note}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryDialog(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleDeliverWork} disabled={actionLoading || !deliveryMessage.trim()}>
              {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Package className="w-4 h-4 mr-2" /> Submit Delivery</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Revision</DialogTitle>
            <DialogDescription>Upload your revised work based on client feedback.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Revision Notes <span className="text-red-500">*</span></label>
              <Textarea placeholder="Describe the changes you've made..." rows={4} value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleSubmitRevision} disabled={actionLoading || !revisionNote.trim()}>
              {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><RefreshCw className="w-4 h-4 mr-2" /> Submit Revision</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}