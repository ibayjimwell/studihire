/**
 * Delivery API — Supabase CRUD for work deliveries
 * Students submit deliverables (files + messages) for client review.
 */

import supabase from "@/lib/supabaseClient";

const DELIVERIES_BUCKET = "deliveries";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Simple UUID generator fallback
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// ---------------------------------------------------------------------------
// CREATE — Submit a delivery for an order
// ---------------------------------------------------------------------------

/**
 * Submit a new delivery version for an order.
 *
 * @param {{
 *   order_id:    string,
 *   student_id:  string,
 *   message:     string,
 *   files?:      File[],
 * }} params
 * @returns {Promise<{ delivery: object|null, error: object|null }>}
 */
export const deliverySubmit = async (params) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { delivery: null, error: { message: "Not authenticated." } };

    const { order_id, student_id, message, files = [] } = params;

    if (!order_id) return { delivery: null, error: { message: "Order ID required." } };
    if (!message?.trim()) return { delivery: null, error: { message: "Delivery message required." } };

    // Upload files to storage
    const uploadedFiles = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return { delivery: null, error: { message: `File "${file.name}" exceeds 50MB limit.` } };
      }

      const ext = file.name.split(".").pop();
      const filePath = `${order_id}/${generateId()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(DELIVERIES_BUCKET)
        .upload(filePath, file, { upsert: false });

      if (uploadError) return { delivery: null, error: uploadError };

      const { data: urlData } = supabase.storage
        .from(DELIVERIES_BUCKET)
        .getPublicUrl(filePath);

      uploadedFiles.push({
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
      });
    }

    // Get current version number
    const { data: existingDeliveries } = await supabase
      .from("deliveries")
      .select("version")
      .eq("order_id", order_id)
      .order("version", { ascending: false })
      .limit(1);

    const version = (existingDeliveries?.[0]?.version || 0) + 1;

    // Insert delivery record
    const { data, error } = await supabase
      .from("deliveries")
      .insert({
        order_id,
        student_id,
        message: message.trim(),
        files: uploadedFiles,
        version,
      })
      .select()
      .single();

    if (error) return { delivery: null, error };
    return { delivery: data, error: null };
  } catch (err) {
    return { delivery: null, error: { message: err.message || "Failed to submit delivery." } };
  }
};

// ---------------------------------------------------------------------------
// READ — Get deliveries for an order
// ---------------------------------------------------------------------------

/**
 * Get all delivery versions for an order.
 *
 * @param {string} orderId
 * @returns {Promise<{ deliveries: object[], error: object|null }>}
 */
export const deliveryGetByOrder = async (orderId) => {
  try {
    if (!orderId) return { deliveries: [], error: { message: "Order ID required." } };

    const { data, error } = await supabase
      .from("deliveries")
      .select("*")
      .eq("order_id", orderId)
      .order("version", { ascending: false });

    if (error) return { deliveries: [], error };
    return { deliveries: data ?? [], error: null };
  } catch (err) {
    return { deliveries: [], error: { message: err.message || "Failed to fetch deliveries." } };
  }
};

/**
 * Get the latest delivery for an order.
 *
 * @param {string} orderId
 * @returns {Promise<{ delivery: object|null, error: object|null }>}
 */
export const deliveryGetLatest = async (orderId) => {
  try {
    if (!orderId) return { delivery: null, error: { message: "Order ID required." } };

    const { data, error } = await supabase
      .from("deliveries")
      .select("*")
      .eq("order_id", orderId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { delivery: null, error };
    return { delivery: data ?? null, error: null };
  } catch (err) {
    return { delivery: null, error: { message: err.message || "Failed to fetch delivery." } };
  }
};