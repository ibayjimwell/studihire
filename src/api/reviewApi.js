/**
 * Review API — Supabase CRUD for gig/order reviews
 * Clients rate students after order completion.
 * Reviews auto-update gig ratings via DB triggers.
 */

import supabase from "@/lib/supabaseClient";

// ---------------------------------------------------------------------------
// CREATE — Submit a review for a completed order
// ---------------------------------------------------------------------------

/**
 * Submit a review for a completed order.
 * Auto-triggers recalculate_gig_ratings() in the database.
 *
 * @param {{
 *   order_id:    string,
 *   gig_id:      string,
 *   reviewee_id: string,  // student user_id
 *   rating:      number,  // 1-5
 *   comment?:    string,
 * }} params
 * @returns {Promise<{ review: object|null, error: object|null }>}
 */
export const reviewCreate = async (params) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { review: null, error: { message: "Not authenticated." } };

    const { order_id, gig_id, reviewee_id, rating, comment = "" } = params;

    if (!order_id) return { review: null, error: { message: "Order ID required." } };
    if (!gig_id) return { review: null, error: { message: "Gig ID required." } };
    if (!reviewee_id) return { review: null, error: { message: "Reviewee ID required." } };
    if (!rating || rating < 1 || rating > 5) {
      return { review: null, error: { message: "Rating must be between 1 and 5." } };
    }

    // Check if review already exists for this order
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("order_id", order_id)
      .eq("reviewer_id", user.id)
      .maybeSingle();

    if (existing) {
      return { review: null, error: { message: "You've already reviewed this order." } };
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        order_id,
        gig_id,
        reviewer_id: user.id,
        reviewee_id,
        rating,
        comment: comment.trim(),
        is_public: true,
      })
      .select()
      .single();

    if (error) return { review: null, error };
    return { review: data, error: null };
  } catch (err) {
    return { review: null, error: { message: err.message || "Failed to submit review." } };
  }
};

// ---------------------------------------------------------------------------
// READ — Get reviews
// ---------------------------------------------------------------------------

/**
 * Get reviews for a gig.
 *
 * @param {string} gigId
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ reviews: object[], error: object|null }>}
 */
export const reviewGetByGig = async (gigId, options = {}) => {
  try {
    if (!gigId) return { reviews: [], error: { message: "Gig ID required." } };

    const { limit = 20 } = options;

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("gig_id", gigId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { reviews: [], error };
    return { reviews: data ?? [], error: null };
  } catch (err) {
    return { reviews: [], error: { message: err.message || "Failed to fetch reviews." } };
  }
};

/**
 * Get reviews for a student.
 *
 * @param {string} studentId
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ reviews: object[], error: object|null }>}
 */
export const reviewGetByStudent = async (studentId, options = {}) => {
  try {
    if (!studentId) return { reviews: [], error: { message: "Student ID required." } };

    const { limit = 20 } = options;

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewee_id", studentId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { reviews: [], error };
    return { reviews: data ?? [], error: null };
  } catch (err) {
    return { reviews: [], error: { message: err.message || "Failed to fetch reviews." } };
  }
};

/**
 * Get review for a specific order.
 *
 * @param {string} orderId
 * @returns {Promise<{ review: object|null, error: object|null }>}
 */
export const reviewGetByOrder = async (orderId) => {
  try {
    if (!orderId) return { review: null, error: { message: "Order ID required." } };

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) return { review: null, error };
    return { review: data ?? null, error: null };
  } catch (err) {
    return { review: null, error: { message: err.message || "Failed to fetch review." } };
  }
};

// ---------------------------------------------------------------------------
// STATS — Get rating stats for a student
// ---------------------------------------------------------------------------

/**
 * Get aggregated rating stats for a student.
 *
 * @param {string} studentId
 * @returns {Promise<{ stats: object, error: object|null }>}
 */
export const reviewGetStudentStats = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", studentId);

    if (error) return { stats: {}, error };

    const ratings = data ?? [];
    const total = ratings.length;
    const avg = total > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
      : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => { distribution[r.rating]++; });

    return {
      stats: { total, average: avg, distribution },
      error: null,
    };
  } catch (err) {
    return { stats: {}, error: { message: err.message || "Failed to fetch stats." } };
  }
};