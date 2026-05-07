// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  chatGetConversations,
  chatGetMessages,
  chatSendMessage,
  chatSendImage,
  chatSendFile,
  chatSubscribeToMessages,
  chatSubscribeToConversations,
  chatUnsubscribe,
  getOtherParticipant,
} from "@/api/chatApi";
import {
  Send,
  Search,
  MessageSquare,
  Paperclip,
  Image,
  File,
  Link as LinkIcon,
  Download,
  Loader2,
  ChevronLeft,
} from "lucide-react";

// ─── url detection ─────────────────────────────────────────────────────
const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
const containsUrl = (text) => URL_REGEX.test(text);

const formatMessageContent = (content, messageType) => {
  if (messageType === "link") {
    const match = content.match(URL_REGEX);
    if (match) {
      return (
        <a
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium break-all hover:opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          {match[0]}
        </a>
      );
    }
  }

  const parts = content.split(/(https?:\/\/[^\s/$.?#].[^\s]*)/gi);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium break-all hover:opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

const getFileIcon = (fileType) => {
  if (!fileType) return "📄";
  if (fileType.includes("pdf")) return "📕";
  if (fileType.includes("word") || fileType.includes("document")) return "📘";
  if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
  if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
  if (fileType.includes("text") || fileType.includes("csv")) return "📝";
  return "📄";
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================
export default function Messages() {
  const { user } = useCurrentUser();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const bottomRef = useRef(null);
  const msgSubRef = useRef(null);
  const convSubRef = useRef(null);

  // ── Load conversations + subscribe to real-time changes ────────────────
  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      const { conversations: data } = await chatGetConversations();
      setConversations(data);
      setLoading(false);

      // Subscribe to real-time conversation updates
      convSubRef.current = chatSubscribeToConversations(user.id, (updatedConv) => {
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === updatedConv.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = updatedConv;
            updated.sort((a, b) => {
              const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
              const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
              return bTime - aTime;
            });
            return updated;
          }
          return [updatedConv, ...prev];
        });
      });
    })();

    return () => {
      chatUnsubscribe(convSubRef.current);
      chatUnsubscribe(msgSubRef.current);
    };
  }, [user]);

  // ── Load messages when active conversation changes + subscribe ────────
  useEffect(() => {
    if (!activeConv?.id) return;

    (async () => {
      const { messages: data } = await chatGetMessages(activeConv.id);
      setMessages(data);
      setShowMobileList(false);
    })();

    // Subscribe to new messages via Realtime (catches messages from OTHER users)
    chatUnsubscribe(msgSubRef.current);
    msgSubRef.current = chatSubscribeToMessages(activeConv.id, (newMsgData) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsgData.id)) return prev;
        return [...prev, newMsgData];
      });
    });

    return () => {
      chatUnsubscribe(msgSubRef.current);
    };
  }, [activeConv?.id]);

  // ── Auto-scroll to bottom on new messages ─────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send text message (OPTIMISTIC) ────────────────────────────────────
  const handleSendText = useCallback(async () => {
    if (!newMsg.trim() || !activeConv || !user || sending) return;
    const msg = newMsg.trim();
    setNewMsg("");
    setSending(true);

    // Optimistic message object
    const optimisticMsg = {
      id: `temp-${Date.now()}-${Math.random()}`,
      conversation_id: activeConv.id,
      sender_id: user.id,
      sender_name: activeConv.participant_names?.[activeConv.participant_ids.indexOf(user.id)] || "You",
      sender_role: "sender",
      content: msg,
      message_type: containsUrl(msg) ? "link" : "text",
      metadata: {},
      created_at: new Date().toISOString(),
    };

    // Add optimistically to messages
    setMessages((prev) => [...prev, optimisticMsg]);

    // Optimistically update conversation list
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === activeConv.id);
      if (idx < 0) return prev;
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        last_message: msg.substring(0, 200),
        last_message_at: new Date().toISOString(),
        last_sender_id: user.id,
        last_sender_name: optimisticMsg.sender_name,
      };
      updated.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });
      return updated;
    });

    // Send to server
    const { message, error } = await chatSendMessage(activeConv.id, msg);

    if (error) {
      // Revert optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setNewMsg(msg);
    } else {
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? message : m))
      );
    }
    setSending(false);
  }, [newMsg, activeConv, user, sending]);

  // ── Send image (OPTIMISTIC) ──────────────────────────────────────────
  const handleSendImage = useCallback(async (file) => {
    if (!file || !activeConv) return;
    setShowUploadMenu(false);
    setSending(true);

    // Optimistic message
    const objectUrl = URL.createObjectURL(file);
    const optimisticMsg = {
      id: `temp-img-${Date.now()}`,
      conversation_id: activeConv.id,
      sender_id: user.id,
      sender_name: "You",
      sender_role: "sender",
      content: objectUrl,
      message_type: "image",
      metadata: { fileName: file.name, fileSize: file.size, fileUrl: objectUrl },
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === activeConv.id);
      if (idx < 0) return prev;
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        last_message: "📷 Photo",
        last_message_at: new Date().toISOString(),
        last_sender_id: user.id,
        last_sender_name: "You",
      };
      updated.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });
      return updated;
    });

    const { message, error } = await chatSendImage(activeConv.id, file);

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } else if (message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? message : m))
      );
    }
    URL.revokeObjectURL(objectUrl);
    setSending(false);
  }, [activeConv]);

  // ── Send file (OPTIMISTIC) ───────────────────────────────────────────
  const handleSendFile = useCallback(async (file) => {
    if (!file || !activeConv) return;
    setShowUploadMenu(false);
    setSending(true);

    const fileSizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const optimisticMsg = {
      id: `temp-file-${Date.now()}`,
      conversation_id: activeConv.id,
      sender_id: user.id,
      sender_name: "You",
      sender_role: "sender",
      content: file.name,
      message_type: "file",
      metadata: { fileName: file.name, fileSize: file.size, fileSizeFormatted, fileType: file.type, fileUrl: "" },
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === activeConv.id);
      if (idx < 0) return prev;
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        last_message: `📎 ${file.name.substring(0, 100)}`,
        last_message_at: new Date().toISOString(),
        last_sender_id: user.id,
        last_sender_name: "You",
      };
      updated.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });
      return updated;
    });

    const { message, error } = await chatSendFile(activeConv.id, file);

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } else if (message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? message : m))
      );
    }
    setSending(false);
  }, [activeConv]);

  // ── File input handlers ──────────────────────────────────────────────
  const onImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleSendImage(file);
    e.target.value = "";
  };

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleSendFile(file);
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────
  const getOtherInfo = (conv) => {
    if (!conv || !user) return { name: "User", avatar: "", role: "" };
    return getOtherParticipant(conv, user.id);
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const other = getOtherInfo(c);
    return other.name.toLowerCase().includes(search.toLowerCase());
  });

  const activeOther = activeConv ? getOtherInfo(activeConv) : null;

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatConvTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <div
          className="flex h-screen"
          style={{ height: "calc(100vh - 64px)" }}
        >
          {/* ── Conversation list ─────────────────────────── */}
          <div
            className={`${
              showMobileList ? "flex" : "hidden"
            } md:flex w-full md:w-80 shrink-0 border-r border-border bg-white flex-col`}
          >
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
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {search ? "No conversations found" : "No conversations yet"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start by contacting a student from a gig
                  </p>
                </div>
              ) : (
                filtered.map((conv) => {
                  const other = getOtherInfo(conv);
                  const isActive = activeConv?.id === conv.id;
                  const lastMsg = conv.last_message || "No messages yet";
                  const isImage = lastMsg === "📷 Photo";
                  const isFile = lastMsg.startsWith("📎");
                  const displayLastMsg = isImage
                    ? "📷 Photo"
                    : isFile
                      ? lastMsg
                      : lastMsg;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConv(conv);
                        setShowMobileList(false);
                      }}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${
                        isActive
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : ""
                      }`}
                    >
                      <Avatar className="w-10 h-10 shrink-0">
                        {other.avatar ? (
                          <AvatarImage src={other.avatar} alt={other.name} />
                        ) : null}
                        <AvatarFallback
                          className={`font-semibold text-sm ${
                            other.role === "student"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {other.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {other.name}
                          </span>
                          {conv.last_message_at && (
                            <span className="text-xs text-muted-foreground ml-2 shrink-0">
                              {formatConvTime(conv.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {displayLastMsg}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Chat area ──────────────────────────────────── */}
          <div
            className={`${
              showMobileList ? "hidden" : "flex"
            } md:flex flex-1 flex-col bg-muted/20`}
          >
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
                {/* ── Chat header ────────────────────────────── */}
                <div className="p-4 bg-white border-b border-border flex items-center gap-3 shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden shrink-0"
                    onClick={() => {
                      setShowMobileList(true);
                      setActiveConv(null);
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="w-9 h-9 shrink-0">
                    {activeOther?.avatar ? (
                      <AvatarImage src={activeOther.avatar} alt={activeOther.name} />
                    ) : null}
                    <AvatarFallback
                      className={`font-semibold text-sm ${
                        activeOther?.role === "student"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {activeOther?.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {activeOther?.name || "User"}
                    </p>
                    <p className="text-xs text-green-500">
                      {activeOther?.role === "student" ? "Student" : "Client"}
                    </p>
                  </div>
                </div>

                {/* ── Messages ────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No messages yet. Say hello!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      const isTemp = msg.id?.startsWith("temp-");
                      const isImageMsg = msg.message_type === "image";
                      const isFileMsg = msg.message_type === "file";

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2 ${isTemp ? "opacity-70" : ""}`}
                        >
                          {/* Avatar for others */}
                          {!isMe && (
                            <Avatar className="w-7 h-7 shrink-0 mt-1">
                              <AvatarFallback
                                className={`text-[10px] ${
                                  msg.sender_role === "student"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {msg.sender_name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={`max-w-[75%] sm:max-w-[60%] ${
                              isMe ? "order-2" : "order-1"
                            }`}
                          >
                            {/* Image message */}
                            {isImageMsg ? (
                              <div
                                className={`rounded-2xl overflow-hidden ${
                                  isMe ? "rounded-br-sm" : "rounded-bl-sm"
                                } border border-border ${isTemp ? "animate-pulse" : ""}`}
                              >
                                <img
                                  src={msg.content}
                                  alt="Sent image"
                                  className="w-full max-w-sm max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                  onClick={() =>
                                    msg.metadata?.fileUrl && window.open(msg.metadata.fileUrl, "_blank")
                                  }
                                  loading="lazy"
                                />
                                <p className="text-[10px] text-muted-foreground px-2 py-1 bg-white text-right">
                                  {formatTime(msg.created_at)}
                                </p>
                              </div>
                            ) : isFileMsg ? (
                              <a
                                href={msg.metadata?.fileUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block p-3 rounded-2xl ${
                                  isMe
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-white text-foreground rounded-bl-sm shadow-sm border border-border"
                                } hover:opacity-95 transition-opacity`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">
                                    {getFileIcon(msg.metadata?.fileType)}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={`text-sm font-medium truncate ${
                                        isMe ? "text-white" : "text-foreground"
                                      }`}
                                    >
                                      {msg.content}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span
                                        className={`text-xs ${
                                          isMe
                                            ? "text-white/70"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {msg.metadata?.fileSizeFormatted ||
                                          formatFileSize(msg.metadata?.fileSize)}
                                      </span>
                                      <Download
                                        className={`w-3 h-3 ${
                                          isMe
                                            ? "text-white/70"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <p
                                  className={`text-[10px] mt-1 ${
                                    isMe ? "text-white/60" : "text-muted-foreground"
                                  }`}
                                >
                                  {formatTime(msg.created_at)}
                                </p>
                              </a>
                            ) : (
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm break-words ${
                                  isMe
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-white text-foreground rounded-bl-sm shadow-sm border border-border"
                                } ${isTemp ? "animate-pulse" : ""}`}
                              >
                                {formatMessageContent(msg.content, msg.message_type)}
                                <p
                                  className={`text-[10px] mt-1 ${
                                    isMe ? "text-white/60" : "text-muted-foreground"
                                  }`}
                                >
                                  {formatTime(msg.created_at)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* ── Input area ──────────────────────────────── */}
                <div className="p-4 bg-white border-t border-border">
                  <div className="flex gap-2 items-end">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowUploadMenu(!showUploadMenu)}
                        disabled={sending}
                      >
                        <Paperclip className="w-5 h-5" />
                      </Button>

                      {showUploadMenu && (
                        <Card className="absolute bottom-full left-0 mb-2 w-48 shadow-lg border-border z-10">
                          <CardContent className="p-2 space-y-1">
                            <button
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm text-left"
                              onClick={() => imageInputRef.current?.click()}
                            >
                              <Image className="w-4 h-4 text-purple-500" />
                              <span>Send Photo</span>
                            </button>
                            <button
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm text-left"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <File className="w-4 h-4 text-blue-500" />
                              <span>Send File</span>
                            </button>
                          </CardContent>
                        </Card>
                      )}

                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={onImageSelect}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={onFileSelect}
                      />
                    </div>

                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pr-10"
                        disabled={sending}
                      />
                      {containsUrl(newMsg) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <LinkIcon className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleSendText}
                      disabled={sending || !newMsg.trim()}
                      className="gradient-primary text-white border-0 shrink-0"
                      size="icon"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Press Enter to send · Max 15MB per file
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}