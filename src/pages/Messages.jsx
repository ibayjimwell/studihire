import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { base44 } from "@/api/mockBase44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Send, Search, MessageSquare, Paperclip } from "lucide-react";
import { format } from "date-fns";

export default function Messages() {
  const { user } = useCurrentUser();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    base44.entities.Conversation.list("-last_message_at", 50).then(
      setConversations,
    );
  }, [user]);

  useEffect(() => {
    if (!activeConv) return;
    base44.entities.Message.filter(
      { conversation_id: activeConv.id },
      "created_date",
      100,
    ).then(setMessages);

    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === activeConv.id) {
        if (event.type === "create")
          setMessages((prev) => [...prev, event.data]);
      }
    });
    return unsub;
  }, [activeConv?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConv || !user) return;
    setSending(true);
    await base44.entities.Message.create({
      conversation_id: activeConv.id,
      sender_id: user.id,
      sender_name: user.full_name,
      content: newMsg.trim(),
      message_type: "text",
    });
    await base44.entities.Conversation.update(activeConv.id, {
      last_message: newMsg.trim(),
      last_message_at: new Date().toISOString(),
    });
    setNewMsg("");
    setSending(false);
  };

  const getOtherName = (conv) => {
    const idx = conv.participant_ids?.indexOf(user?.id);
    if (idx === -1 || idx === undefined) return "User";
    const otherIdx = idx === 0 ? 1 : 0;
    return conv.participant_names?.[otherIdx] || "User";
  };

  const filtered = conversations.filter(
    (c) =>
      !search || getOtherName(c).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <div
          className="flex h-screen pt-0"
          style={{ height: "calc(100vh - 0px)" }}
        >
          {/* Conversation list */}
          <div className="w-80 shrink-0 border-r border-border bg-white flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground mb-3">
                Messages
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No conversations yet
                  </p>
                </div>
              ) : (
                filtered.map((conv) => {
                  const isActive = activeConv?.id === conv.id;
                  const otherName = getOtherName(conv);
                  const unread = conv.unread_counts?.[user?.id] || 0;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                    >
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {otherName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {otherName}
                          </span>
                          {conv.last_message_at && (
                            <span className="text-xs text-muted-foreground ml-2 shrink-0">
                              {format(new Date(conv.last_message_at), "MMM d")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-muted/20">
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose from your messages on the left
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-4 bg-white border-b border-border flex items-center gap-3 shadow-sm">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {getOtherName(activeConv)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {getOtherName(activeConv)}
                    </p>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] ${isMe ? "order-2" : "order-1"}`}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-white text-foreground rounded-bl-sm shadow-sm border border-border"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <p
                            className={`text-xs text-muted-foreground mt-1 ${isMe ? "text-right" : "text-left"}`}
                          >
                            {msg.created_date
                              ? format(new Date(msg.created_date), "h:mm a")
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-border">
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
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sending || !newMsg.trim()}
                      className="gradient-primary text-white border-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
