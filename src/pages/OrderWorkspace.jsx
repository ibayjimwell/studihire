import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navbar from "@/components/layout/Navbar";
import { base44 } from "@/api/mockBase44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  Clock,
  CheckCircle,
  Send,
  Upload,
  Package,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Star,
  Loader2,
  ExternalLink,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  awaiting_payment: {
    label: "Awaiting Payment",
    color: "bg-gray-100 text-gray-700",
  },
  pending: { label: "Pending Start", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  revision_requested: {
    label: "Revision Requested",
    color: "bg-orange-100 text-orange-700",
  },
  delivered: { label: "Delivered", color: "bg-purple-100 text-purple-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-700" },
};

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
    searchParams.get("payment") === "success",
  );
  const bottomRef = useRef(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  useEffect(() => {
    if (!conversation) return;
    base44.entities.Message.filter(
      { conversation_id: conversation.id },
      "created_date",
      100,
    ).then(setMessages);
    const unsub = base44.entities.Message.subscribe((event) => {
      if (
        event.data?.conversation_id === conversation.id &&
        event.type === "create"
      ) {
        setMessages((prev) => [...prev, event.data]);
      }
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadOrder = async () => {
    const orders = await base44.entities.Order.filter(
      { id },
      "-created_date",
      1,
    );
    const o = orders[0];
    setOrder(o);

    if (o) {
      // Find or create a conversation for this order
      const convs = await base44.entities.Conversation.filter(
        { related_gig_id: o.gig_id },
        "-created_date",
        10,
      );
      const existing = convs.find(
        (c) =>
          c.participant_ids?.includes(o.client_id) &&
          c.participant_ids?.includes(o.student_id),
      );
      if (existing) {
        setConversation(existing);
      } else {
        const conv = await base44.entities.Conversation.create({
          participant_ids: [o.client_id, o.student_id],
          participant_names: [o.client_name, o.student_name],
          related_gig_id: o.gig_id,
          last_message: "",
          status: "active",
        });
        setConversation(conv);
      }
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !conversation || !user) return;
    await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_id: user.id,
      sender_name: user.full_name,
      content: newMsg.trim(),
      message_type: "text",
    });
    await base44.entities.Conversation.update(conversation.id, {
      last_message: newMsg.trim(),
      last_message_at: new Date().toISOString(),
    });
    setNewMsg("");
  };

  const isClient = user?.id === order?.client_id;
  const isStudent = user?.id === order?.student_id;

  const updateOrderStatus = async (status, extra = {}) => {
    setActionLoading(true);
    const updated = await base44.entities.Order.update(order.id, {
      status,
      ...extra,
    });
    setOrder((prev) => ({ ...prev, status, ...extra }));

    // Notify the other party
    const notifyUserId = isClient ? order.student_id : order.client_id;
    const messages_map = {
      in_progress: {
        title: "🚀 Order Started!",
        body: `${user.full_name} has started working on your order.`,
      },
      delivered: {
        title: "📦 Order Delivered!",
        body: `${user.full_name} has delivered your order. Please review.`,
      },
      revision_requested: {
        title: "🔄 Revision Requested",
        body: `${user.full_name} requested a revision.`,
      },
      completed: {
        title: "✅ Order Completed!",
        body: `${user.full_name} marked the order as complete. Payment will be released.`,
      },
      cancelled: {
        title: "❌ Order Cancelled",
        body: `Your order has been cancelled.`,
      },
    };
    if (messages_map[status]) {
      await base44.entities.Notification.create({
        user_id: notifyUserId,
        type: "gig_order",
        title: messages_map[status].title,
        body: messages_map[status].body,
        link: `/order/${order.id}`,
        is_read: false,
      });
    }

    // Release payment on completion
    if (status === "completed" && order.payment_id) {
      await base44.entities.Payment.update(order.payment_id, {
        status: "released",
        released_at: new Date().toISOString(),
      });
    }
    setActionLoading(false);
  };

  const handleDeliver = () => {
    if (!deliveryMessage.trim()) return;
    updateOrderStatus("delivered", {
      delivery_message: deliveryMessage,
      delivery_url: deliveryUrl,
    });
    // Post delivery message in chat
    if (conversation) {
      base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_name: user.full_name,
        content: `📦 Delivery: ${deliveryMessage}${deliveryUrl ? `\n\nDelivery link: ${deliveryUrl}` : ""}`,
        message_type: "system",
      });
    }
    setDeliveryMessage("");
    setDeliveryUrl("");
  };

  const handleRevision = () => {
    if (!revisionNote.trim()) return;
    updateOrderStatus("revision_requested", { revision_note: revisionNote });
    if (conversation) {
      base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_name: user.full_name,
        content: `🔄 Revision requested: ${revisionNote}`,
        message_type: "system",
      });
    }
    setRevisionNote("");
  };

  const handleComplete = async () => {
    await updateOrderStatus("completed", {
      completed_at: new Date().toISOString(),
    });
    // Submit review
    if (reviewComment.trim()) {
      await base44.entities.Review.create({
        reviewer_id: user.id,
        reviewee_id: order.student_id,
        gig_id: order.gig_id,
        rating: reviewRating,
        comment: reviewComment,
        reviewer_role: "client",
        is_public: true,
      });
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

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Payment success banner */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">
                Payment successful! 🎉
              </p>
              <p className="text-sm text-green-700">
                Your order has been placed. The student will start working soon.
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-auto text-green-600 hover:text-green-800 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Order Header */}
        <div className="bg-white border border-border rounded-2xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusCfg.color}`}
                >
                  {statusCfg.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  Order #{order.id?.slice(-8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-xl font-bold text-foreground">
                {order.gig_title}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Package: <strong>{order.package_name}</strong> · ₱
                {order.amount?.toLocaleString()}
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 text-right shrink-0">
              <p className="flex items-center gap-1 justify-end">
                <Clock className="w-4 h-4" /> Due:{" "}
                {order.due_date
                  ? format(new Date(order.due_date), "MMM d, yyyy")
                  : "—"}
              </p>
              <p>
                Freelancer: <strong>{order.student_name}</strong>
              </p>
              <p>
                Client: <strong>{order.client_name}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main workspace */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="activity">
              <TabsList className="bg-muted mb-4">
                <TabsTrigger value="activity">
                  <Package className="w-4 h-4 mr-1" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="messages">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="requirements">
                  <FileText className="w-4 h-4 mr-1" />
                  Requirements
                </TabsTrigger>
              </TabsList>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                {/* Student: Mark as Started */}
                {isStudent && order.status === "pending" && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <p className="font-semibold text-blue-900 text-sm mb-3">
                        Ready to start? Click below to accept this order.
                      </p>
                      <Button
                        className="gradient-primary text-white border-0 gap-2"
                        onClick={() => updateOrderStatus("in_progress")}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        Start Working
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Student: Deliver */}
                {isStudent &&
                  (order.status === "in_progress" ||
                    order.status === "revision_requested") && (
                    <Card className="border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                          📦 Submit Delivery
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          placeholder="Describe what you've delivered..."
                          rows={3}
                          value={deliveryMessage}
                          onChange={(e) => setDeliveryMessage(e.target.value)}
                        />
                        <Input
                          placeholder="Delivery link (Google Drive, Figma, GitHub, etc.) - optional"
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

                {/* Client: Delivered — Accept or Request Revision */}
                {isClient && order.status === "delivered" && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4 space-y-3">
                      <p className="font-semibold text-purple-900 text-sm">
                        📦 Delivery received!
                      </p>
                      {order.delivery_message && (
                        <div className="bg-white rounded-lg p-3 text-sm text-foreground border border-purple-100">
                          <p className="font-medium mb-1">Student's message:</p>
                          <p className="text-muted-foreground">
                            {order.delivery_message}
                          </p>
                          {order.delivery_url && (
                            <a
                              href={order.delivery_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary text-xs mt-2 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> View Delivery
                            </a>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-purple-900">
                          Request a revision if needed:
                        </p>
                        <Textarea
                          placeholder="Describe what needs to be changed..."
                          rows={2}
                          value={revisionNote}
                          onChange={(e) => setRevisionNote(e.target.value)}
                        />
                        <Button
                          variant="outline"
                          className="w-full border-orange-200 text-orange-700 gap-2"
                          onClick={handleRevision}
                          disabled={actionLoading || !revisionNote.trim()}
                        >
                          <RefreshCw className="w-4 h-4" /> Request Revision
                        </Button>
                      </div>

                      <div className="border-t border-purple-200 pt-3">
                        <p className="text-sm font-medium text-purple-900 mb-2">
                          Happy with the work? Leave a review & complete:
                        </p>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} onClick={() => setReviewRating(s)}>
                              <Star
                                className={`w-5 h-5 ${s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            </button>
                          ))}
                        </div>
                        <Textarea
                          placeholder="Write a review (optional)..."
                          rows={2}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="mb-2"
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
                          Accept & Complete Order
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          Payment will be released to the student.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Completed */}
                {order.status === "completed" && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900">
                          Order Completed!
                        </p>
                        <p className="text-sm text-green-700">
                          Payment has been released to {order.student_name}.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order timeline */}
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Order Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <TimelineItem
                      icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                      label="Order Placed"
                      date={order.created_date}
                      done
                    />
                    <TimelineItem
                      icon={
                        <Clock
                          className={`w-4 h-4 ${["in_progress", "delivered", "completed"].includes(order.status) ? "text-blue-500" : "text-gray-300"}`}
                        />
                      }
                      label="Work Started"
                      done={["in_progress", "delivered", "completed"].includes(
                        order.status,
                      )}
                    />
                    <TimelineItem
                      icon={
                        <Package
                          className={`w-4 h-4 ${["delivered", "completed"].includes(order.status) ? "text-purple-500" : "text-gray-300"}`}
                        />
                      }
                      label="Delivered"
                      done={["delivered", "completed"].includes(order.status)}
                      date={
                        order.status === "delivered" ? order.updated_date : null
                      }
                    />
                    <TimelineItem
                      icon={
                        <CheckCircle
                          className={`w-4 h-4 ${order.status === "completed" ? "text-green-500" : "text-gray-300"}`}
                        />
                      }
                      label="Completed & Paid"
                      done={order.status === "completed"}
                      date={order.completed_at}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages">
                <Card className="border-border h-[500px] flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground text-sm">
                        No messages yet. Say hello!
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        const isSystem = msg.message_type === "system";
                        if (isSystem)
                          return (
                            <div key={msg.id} className="flex justify-center">
                              <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                                {msg.content}
                              </span>
                            </div>
                          );
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-white border border-border rounded-bl-sm shadow-sm"}`}
                            >
                              {!isMe && (
                                <p className="text-xs font-semibold mb-1 opacity-70">
                                  {msg.sender_name}
                                </p>
                              )}
                              <p>{msg.content}</p>
                              <p
                                className={`text-xs mt-1 opacity-60 ${isMe ? "text-right" : "text-left"}`}
                              >
                                {msg.created_date
                                  ? format(new Date(msg.created_date), "h:mm a")
                                  : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>
                  <div className="p-3 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          (e.preventDefault(), sendMessage())
                        }
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMsg.trim()}
                        className="gradient-primary text-white border-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements">
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Client Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-xl p-4 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {order.requirements || "No requirements provided."}
                    </div>
                    {order.revision_note && (
                      <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <p className="text-sm font-semibold text-orange-800 mb-1 flex items-center gap-1">
                          <RefreshCw className="w-4 h-4" /> Latest Revision Note
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

          {/* Right panel */}
          <div className="space-y-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-primary">
                    ₱{order.amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{order.delivery_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revisions</span>
                  <span>{order.revisions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cancel button */}
            {(isClient || isStudent) &&
              !["completed", "cancelled", "disputed"].includes(
                order.status,
              ) && (
                <Card className="border-red-100">
                  <CardContent className="p-4">
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2 text-sm"
                      onClick={() => updateOrderStatus("cancelled")}
                      disabled={actionLoading}
                    >
                      <AlertTriangle className="w-4 h-4" /> Cancel Order
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Cancellation may affect your rating.
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

function TimelineItem({ icon, label, date, done }) {
  return (
    <div className={`flex items-center gap-3 ${done ? "" : "opacity-40"}`}>
      {icon}
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {date && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(date), "MMM d, yyyy h:mm a")}
          </p>
        )}
      </div>
      {done && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
    </div>
  );
}
