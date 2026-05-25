/**
 * Public Profile API — Supabase read-only operations for viewing student profiles
 * Used by the public student profile page (/student/:id)
 */

import supabase from "@/lib/supabaseClient";

/**
 * Fetch a student's public profile by user_id.
 *
 * @param {string} userId
 * @returns {Promise<{ profile: object|null, error: object|null }>}
 */
export const publicProfileGetStudent = async (userId) => {
  try {
    if (!userId) return { profile: null, error: { message: "User ID is required." } };

    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return { profile: null, error };
    return { profile: data ?? null, error: null };
  } catch (err) {
    return { profile: null, error: { message: err.message || "Failed to fetch profile." } };
  }
};

/**
 * Fetch a student's submission (academic info) by user_id.
 *
 * @param {string} userId
 * @returns {Promise<{ submission: object|null, error: object|null }>}
 */
export const publicProfileGetSubmission = async (userId) => {
  try {
    if (!userId) return { submission: null, error: { message: "User ID is required." } };

    const { data, error } = await supabase
      .from("student_submissions")
      .select("*")
      .eq("user_id", userId)
      .eq("submission_status", "approved")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { submission: null, error };
    return { submission: data ?? null, error: null };
  } catch (err) {
    return { submission: null, error: { message: err.message || "Failed to fetch submission." } };
  }
};

/**
 * Fetch active gigs for a student.
 *
 * @param {string} userId
 * @returns {Promise<{ gigs: object[], error: object|null }>}
 */
export const publicProfileGetGigs = async (userId) => {
  try {
    if (!userId) return { gigs: [], error: { message: "User ID is required." } };

    const { data, error } = await supabase
      .from("gigs")
      .select("*")
      .eq("student_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) return { gigs: [], error };
    return { gigs: data ?? [], error: null };
  } catch (err) {
    return { gigs: [], error: { message: err.message || "Failed to fetch gigs." } };
  }
};

/**
 * Fetch public credentials for a student (only is_public = true).
 *
 * @param {string} userId
 * @returns {Promise<{ credentials: object[], error: object|null }>}
 */
export const publicProfileGetCredentials = async (userId) => {
  try {
    if (!userId) return { credentials: [], error: { message: "User ID is required." } };

    const { data, error } = await supabase
      .from("credentials")
      .select("*")
      .eq("student_id", userId)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) return { credentials: [], error };
    return { credentials: data ?? [], error: null };
  } catch (err) {
    return { credentials: [], error: { message: err.message || "Failed to fetch credentials." } };
  }
};

/**
 * Fetch reviews for a student.
 *
 * @param {string} userId
 * @returns {Promise<{ reviews: object[], stats: object, error: object|null }>}
 */
export const publicProfileGetReviews = async (userId) => {
  try {
    if (!userId) return { reviews: [], stats: {}, error: { message: "User ID is required." } };

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return { reviews: [], stats: {}, error };

    const reviews = data ?? [];
    const total = reviews.length;
    const avg = total > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
      : 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { if (distribution[r.rating] !== undefined) distribution[r.rating]++; });

    return {
      reviews,
      stats: { total, average: avg, distribution },
      error: null,
    };
  } catch (err) {
    return { reviews: [], stats: {}, error: { message: err.message || "Failed to fetch reviews." } };
  }
};