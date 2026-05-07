/**
 * Chat API — Supabase CRUD operations for conversations & messages
 * Real-time messaging between clients and students.
 * Follows same pattern as gigApi.js and orderApi.js.
 */

import supabase from "@/lib/supabaseClient";

// Simple UUID v4 generator using crypto API (available in all modern browsers)
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAT_BUCKET = "chat-attachments";
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
  LINK: "link",
  SYSTEM: "system",
};

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-rar-compressed",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user;
};

const detectMessageType = (content) => {
  // Check if content is a URL
  const urlPattern = /https?:\/\/[^\s]+/gi;
  if (urlPattern.test(content) && content.trim().split(/\s+/).length <= 2) {
    return MESSAGE_TYPES.LINK;
  }
  return MESSAGE_TYPES.TEXT;
};

// ---------------------------------------------------------------------------
// CONVERSATIONS
// ---------------------------------------------------------------------------

/**
 * Create or find an existing conversation between two participants.
 * If a conversation already exists with the same participants, it returns that one.
 *
 * @param {{
 *   otherUserId:   string,
 *   otherName?:    string,
 *   otherAvatar?:  string,
 *   otherRole?:    string,
 *   gigId?:        string,
 *   gigTitle?:     string,
 *   orderId?:      string,
 * }} params
 * @returns {Promise<{ conversation: object|null, error: object|null }>}
 */
export const chatStartConversation = async (params) => {
  try {
    const user = await getCurrentUser();
    const { otherUserId, otherName, otherAvatar, otherRole, gigId, gigTitle, orderId } = params;

    if (!otherUserId) {
      return { conversation: null, error: { message: "Other user ID is required." } };
    }

    // Check if conversation already exists between these two users
    // Use a contains check: participant_ids @> ARRAY[user.id, otherUserId]
    const { data: existingConvs, error: searchError } = await supabase
      .from("conversations")
      .select("*")
      .contains("participant_ids", [user.id, otherUserId])
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(1);

    if (!searchError && existingConvs?.length > 0) {
      return { conversation: existingConvs[0], error: null };
    }

    // Fetch current user's profile info
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("full_name, profile_image_url")
      .eq("user_id", user.id)
      .single();

    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("full_name, profile_image_url")
      .eq("user_id", user.id)
      .single();

    const currentName = profile?.full_name || clientProfile?.full_name || user.email?.split("@")[0] || "User";
    const currentAvatar = profile?.profile_image_url || clientProfile?.profile_image_url || "";
    const currentRole = profile ? "student" : "client";

    // Determine if current user is participant at index 0 or 1
    // Sort IDs for consistent participant ordering
    const participantIds = [user.id, otherUserId];
    const participantNames = [currentName, otherName || "User"];
    const participantAvatars = [currentAvatar, otherAvatar || ""];
    const participantRoles = [currentRole, otherRole || ""];

    const payload = {
      participant_ids: participantIds,
      participant_names: participantNames,
      participant_avatars: participantAvatars,
      participant_roles: participantRoles,
      gig_id: gigId || null,
      gig_title: gigTitle || null,
      order_id: orderId || null,
    };

    const { data, error } = await supabase
      .from("conversations")
      .insert(payload)
      .select()
      .single();

    if (error) return { conversation: null, error };
    return { conversation: data, error: null };
  } catch (err) {
    return { conversation: null, error: { message: err.message || "Failed to start conversation." } };
  }
};

/**
 * Get all conversations for the current user.
 *
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ conversations: object[], error: object|null }>}
 */
export const chatGetConversations = async (options = {}) => {
  try {
    const user = await getCurrentUser();
    const { limit = 50 } = options;

    // Use @> operator to check if user is in participant_ids array
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .contains("participant_ids", [user.id])
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) return { conversations: [], error };
    return { conversations: data ?? [], error: null };
  } catch (err) {
    return { conversations: [], error: { message: err.message || "Failed to fetch conversations." } };
  }
};

/**
 * Get a single conversation by ID.
 *
 * @param {string} conversationId
 * @returns {Promise<{ conversation: object|null, error: object|null }>}
 */
export const chatGetConversation = async (conversationId) => {
  try {
    if (!conversationId) return { conversation: null, error: { message: "Conversation ID is required." } };

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error) return { conversation: null, error };
    return { conversation: data, error: null };
  } catch (err) {
    return { conversation: null, error: { message: err.message || "Failed to fetch conversation." } };
  }
};

// ---------------------------------------------------------------------------
// MESSAGES
// ---------------------------------------------------------------------------

/**
 * Send a text message in a conversation.
 *
 * @param {string} conversationId
 * @param {string} content
 * @returns {Promise<{ message: object|null, error: object|null }>}
 */
export const chatSendMessage = async (conversationId, content) => {
  try {
    const user = await getCurrentUser();

    if (!conversationId) {
      return { message: null, error: { message: "Conversation ID is required." } };
    }

    if (!content?.trim()) {
      return { message: null, error: { message: "Message content is required." } };
    }

    // Detect if this is a link
    const messageType = detectMessageType(content);

    // Determine sender role
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const senderRole = studentProfile ? "student" : "client";

    // Create the message
    const { data: msgData, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: studentProfile?.full_name || user.email?.split("@")[0] || "User",
        sender_role: senderRole,
        content: content.trim(),
        message_type: messageType,
        metadata: {},
      })
      .select()
      .single();

    if (msgError) return { message: null, error: msgError };

    // Update the conversation's last message
    await supabase
      .from("conversations")
      .update({
        last_message: content.trim().substring(0, 200),
        last_message_at: new Date().toISOString(),
        last_sender_id: user.id,
        last_sender_name: msgData.sender_name,
      })
      .eq("id", conversationId);

    return { message: msgData, error: null };
  } catch (err) {
    return { message: null, error: { message: err.message || "Failed to send message." } };
  }
};

/**
 * Upload and send an image message.
 *
 * @param {string} conversationId
 * @param {File} file
 * @returns {Promise<{ message: object|null, error: object|null }>}
 */
export const chatSendImage = async (conversationId, file) => {
  try {
    const user = await getCurrentUser();

    if (!conversationId) {
      return { message: null, error: { message: "Conversation ID is required." } };
    }

    if (!file) {
      return { message: null, error: { message: "Image file is required." } };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { message: null, error: { message: "File size exceeds 15MB limit." } };
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { message: null, error: { message: "Invalid image format. Allowed: JPEG, PNG, GIF, WebP." } };
    }

    // Upload to storage
    const ext = file.name.split(".").pop();
    const filePath = `images/${conversationId}/${generateId()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) return { message: null, error: uploadError };

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(CHAT_BUCKET)
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Determine sender role
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const senderRole = studentProfile ? "student" : "client";
    const senderName = studentProfile?.full_name || user.email?.split("@")[0] || "User";

    // Create message with image type
    const { data: msgData, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: senderName,
        sender_role: senderRole,
        content: imageUrl,
        message_type: MESSAGE_TYPES.IMAGE,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileUrl: imageUrl,
        },
      })
      .select()
      .single();

    if (msgError) return { message: null, error: msgError };

    // Update conversation
    await supabase
      .from("conversations")
      .update({
        last_message: "📷 Photo",
        last_message_at: new Date().toISOString(),
        last_sender_id: user.id,
        last_sender_name: senderName,
      })
      .eq("id", conversationId);

    return { message: msgData, error: null };
  } catch (err) {
    return { message: null, error: { message: err.message || "Failed to send image." } };
  }
};

/**
 * Upload and send a file attachment.
 *
 * @param {string} conversationId
 * @param {File} file
 * @returns {Promise<{ message: object|null, error: object|null }>}
 */
export const chatSendFile = async (conversationId, file) => {
  try {
    const user = await getCurrentUser();

    if (!conversationId) {
      return { message: null, error: { message: "Conversation ID is required." } };
    }

    if (!file) {
      return { message: null, error: { message: "File is required." } };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { message: null, error: { message: "File size exceeds 15MB limit." } };
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { message: null, error: { message: "File type not supported." } };
    }

    // Upload to storage
    const ext = file.name.split(".").pop();
    const filePath = `files/${conversationId}/${generateId()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { error: uploadError } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) return { message: null, error: uploadError };

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(CHAT_BUCKET)
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Determine sender role
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const senderRole = studentProfile ? "student" : "client";
    const senderName = studentProfile?.full_name || user.email?.split("@")[0] || "User";

    // Format file size for display
    const fileSizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    // Create message with file type
    const { data: msgData, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: senderName,
        sender_role: senderRole,
        content: file.name,
        message_type: MESSAGE_TYPES.FILE,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileSizeFormatted,
          fileType: file.type,
          fileUrl,
        },
      })
      .select()
      .single();

    if (msgError) return { message: null, error: msgError };

    // Update conversation
    await supabase
      .from("conversations")
      .update({
        last_message: `📎 ${file.name.substring(0, 100)}`,
        last_message_at: new Date().toISOString(),
        last_sender_id: user.id,
        last_sender_name: senderName,
      })
      .eq("id", conversationId);

    return { message: msgData, error: null };
  } catch (err) {
    return { message: null, error: { message: err.message || "Failed to send file." } };
  }
};

/**
 * Get messages for a conversation.
 *
 * @param {string} conversationId
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ messages: object[], error: object|null }>}
 */
export const chatGetMessages = async (conversationId, options = {}) => {
  try {
    if (!conversationId) return { messages: [], error: { message: "Conversation ID is required." } };

    const { limit = 100 } = options;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) return { messages: [], error };
    return { messages: data ?? [], error: null };
  } catch (err) {
    return { messages: [], error: { message: err.message || "Failed to fetch messages." } };
  }
};

/**
 * Subscribe to new messages in a conversation via Supabase Realtime.
 *
 * @param {string} conversationId
 * @param {function} onMessage - Callback with new message data
 * @returns {object} subscription object with unsubscribe()
 */
export const chatSubscribeToMessages = (conversationId, onMessage) => {
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to conversation updates (for real-time last_message changes).
 *
 * @param {string} userId
 * @param {function} onUpdate - Callback with updated conversation
 * @returns {object} subscription object with unsubscribe()
 */
export const chatSubscribeToConversations = (userId, onUpdate) => {
  const subscription = supabase
    .channel(`conversations:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
        filter: `participant_ids=cs.{${userId}}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Unsubscribe from a channel.
 *
 * @param {object} subscription
 */
export const chatUnsubscribe = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};

/**
 * Get the other participant's info from a conversation relative to the current user.
 *
 * @param {object} conversation
 * @param {string} userId
 * @returns {{ id: string, name: string, avatar: string, role: string }}
 */
export const getOtherParticipant = (conversation, userId) => {
  if (!conversation?.participant_ids) {
    return { id: "", name: "Unknown", avatar: "", role: "" };
  }

  const myIndex = conversation.participant_ids.indexOf(userId);
  if (myIndex === -1) {
    // User not found - return first participant
    return {
      id: conversation.participant_ids[0] || "",
      name: conversation.participant_names?.[0] || "User",
      avatar: conversation.participant_avatars?.[0] || "",
      role: conversation.participant_roles?.[0] || "",
    };
  }

  const otherIndex = myIndex === 0 ? 1 : 0;

  return {
    id: conversation.participant_ids[otherIndex] || "",
    name: conversation.participant_names?.[otherIndex] || "User",
    avatar: conversation.participant_avatars?.[otherIndex] || "",
    role: conversation.participant_roles?.[otherIndex] || "",
  };
};