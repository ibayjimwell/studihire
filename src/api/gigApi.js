/**
 * Gig API — Supabase CRUD operations
 * All gig-related database interactions live here.
 * Follow the same pattern as authUtils.js: clean separation of concerns.
 */

import supabase from "@/lib/supabaseClient";

// ---------------------------------------------------------------------------
// Types / constants
// ---------------------------------------------------------------------------

/** @typedef {'active'|'paused'|'draft'|'deleted'} GigStatus */

/**
 * @typedef {Object} GigPackage
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {number} delivery_days
 * @property {number} revisions
 * @property {string[]} features
 */

/**
 * @typedef {Object} Gig
 * @property {string}       id
 * @property {string}       student_id
 * @property {string}       title
 * @property {string}       description
 * @property {string}       category
 * @property {string}       [subcategory]
 * @property {string[]}     skills_required
 * @property {string[]}     tags
 * @property {GigPackage[]} packages
 * @property {string}       [cover_image_url]
 * @property {GigStatus}    status
 * @property {number}       rating
 * @property {number}       total_orders
 * @property {number}       total_reviews
 * @property {string}       created_at
 * @property {string}       updated_at
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validates the core fields required to create/update a gig.
 * @param {Partial<Gig>} gig
 * @returns {{ isValid: boolean, message: string }}
 */
const validateGig = (gig) => {
  if (!gig.title || gig.title.trim().length < 5) {
    return { isValid: false, message: "Title must be at least 5 characters." };
  }
  if (!gig.description || gig.description.trim().length < 20) {
    return {
      isValid: false,
      message: "Description must be at least 20 characters.",
    };
  }
  if (!gig.category) {
    return { isValid: false, message: "Category is required." };
  }
  if (!gig.packages || gig.packages.length === 0) {
    return { isValid: false, message: "At least one package is required." };
  }
  return { isValid: true, message: "" };
};

// ---------------------------------------------------------------------------
// BROWSE — public marketplace listing
// ---------------------------------------------------------------------------
 
/**
 * Fetches active gigs for the public marketplace with full filtering support.
 *
 * @param {{
 *   search?:   string,
 *   category?: string,
 *   sort?:     'newest' | 'rating' | 'orders',
 *   limit?:    number,
 *   offset?:   number,
 * }} options
 * @returns {Promise<{ gigs: object[], count: number, error: object|null }>}
 */
export const gigBrowse = async (options = {}) => {
  try {
    const {
      search   = "",
      category = "",
      sort     = "newest",
      limit    = 24,
      offset   = 0,
    } = options;
 
    const SORT_MAP = {
      newest: { column: "created_at",    ascending: false },
      rating: { column: "rating",        ascending: false },
      orders: { column: "total_orders",  ascending: false },
    };
    const { column, ascending } = SORT_MAP[sort] ?? SORT_MAP.newest;
 
    let query = supabase
      .from("gigs")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .order(column, { ascending })
      .range(offset, offset + limit - 1);
 
    if (category) {
      query = query.eq("category", category);
    }
 
    if (search.trim()) {
      // Match title OR any element inside the skills_required text array
      query = query.or(
        `title.ilike.%${search.trim()}%,skills_required.cs.{${search.trim()}}`
      );
    }
 
    const { data, count, error } = await query;
    if (error) return { gigs: [], count: 0, error };
    return { gigs: data ?? [], count: count ?? 0, error: null };
  } catch (err) {
    return { gigs: [], count: 0, error: { message: err.message || "Failed to fetch gigs." } };
  }
};

// ---------------------------------------------------------------------------
// BROWSE — batch-fetch student profiles by user_id list
// ---------------------------------------------------------------------------
 
/**
 * Returns a map of { [user_id]: profile } for a list of student IDs.
 *
 * @param {string[]} studentIds
 * @returns {Promise<{ profileMap: Record<string, object>, error: object|null }>}
 */
export const gigFetchStudentProfiles = async (studentIds) => {
  try {
    if (!studentIds.length) return { profileMap: {}, error: null };

    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")           
      .in("user_id", studentIds);

    if (error) return { profileMap: {}, error };

    const profileMap = {};
    (data ?? []).forEach((p) => { profileMap[p.user_id] = p; });
    return { profileMap, error: null };
  } catch (err) {
    return { profileMap: {}, error: { message: err.message || "Failed to fetch profiles." } };
  }
};

// ---------------------------------------------------------------------------
// DETAIL — single public gig
// ---------------------------------------------------------------------------
 
/**
 * Fetches a single gig by id.
 *
 * @param {string} gigId
 * @returns {Promise<{ gig: object|null, error: object|null }>}
 */
export const gigGetById = async (gigId) => {
  try {
    if (!gigId) return { gig: null, error: { message: "Gig ID is required." } };
 
    const { data, error } = await supabase
      .from("gigs")
      .select("*")
      .eq("id", gigId)
      .single();
 
    if (error) return { gig: null, error };
    return { gig: data, error: null };
  } catch (err) {
    return { gig: null, error: { message: err.message || "Failed to fetch gig." } };
  }
};

/**
 * Fetches a single student profile by user_id.
 *
 * @param {string} userId
 * @returns {Promise<{ profile: object|null, error: object|null }>}
 */
export const gigGetStudentProfile = async (userId) => {
  try {
    if (!userId) return { profile: null, error: { message: "User ID is required." } };
 
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
 
    if (error) return { profile: null, error };
    return { profile: data, error: null };
  } catch (err) {
    return { profile: null, error: { message: err.message || "Failed to fetch profile." } };
  }
};

/**
 * Fetches reviews for a gig, newest first.
 *
 * @param {string} gigId
 * @param {number} [limit=20]
 * @returns {Promise<{ reviews: object[], error: object|null }>}
 */
export const gigGetReviews = async (gigId, limit = 20) => {
  try {
    if (!gigId) return { reviews: [], error: { message: "Gig ID is required." } };
 
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


// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

/**
 * Creates a new gig for the currently authenticated student.
 *
 * @param {Omit<Gig, 'id'|'student_id'|'rating'|'total_orders'|'total_reviews'|'created_at'|'updated_at'>} gigData
 * @returns {Promise<{ gig: Gig|null, error: object|null }>}
 */
export const gigCreate = async (gigData) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { gig: null, error: { message: "You must be logged in to create a gig." } };
    }

    const validation = validateGig(gigData);
    if (!validation.isValid) {
      return { gig: null, error: { message: validation.message } };
    }

    const payload = {
      student_id:       user.id,
      title:            gigData.title.trim(),
      description:      gigData.description.trim(),
      category:         gigData.category,
      subcategory:      gigData.subcategory?.trim() || null,
      skills_required:  gigData.skills_required ?? [],
      tags:             gigData.tags ?? [],
      packages:         gigData.packages,
      cover_image_url:  gigData.cover_image_url || null,
      status:           gigData.status ?? "active",
    };

    const { data, error } = await supabase
      .from("gigs")
      .insert(payload)
      .select()
      .single();

    if (error) return { gig: null, error };
    return { gig: data, error: null };
  } catch (err) {
    return { gig: null, error: { message: err.message || "Failed to create gig." } };
  }
};

// ---------------------------------------------------------------------------
// READ — list the current student's gigs
// ---------------------------------------------------------------------------

/**
 * Fetches all gigs owned by the authenticated student (excludes soft-deleted).
 *
 * @param {{ status?: GigStatus, orderBy?: string, ascending?: boolean }} [options]
 * @returns {Promise<{ gigs: Gig[], error: object|null }>}
 */
export const gigGetMyGigs = async (options = {}) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { gigs: [], error: { message: "Not authenticated." } };
    }

    const { status, orderBy = "created_at", ascending = false } = options;

    let query = supabase
      .from("gigs")
      .select("*")
      .eq("student_id", user.id)
      .neq("status", "deleted")   // never surface soft-deleted rows
      .order(orderBy, { ascending });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) return { gigs: [], error };
    return { gigs: data ?? [], error: null };
  } catch (err) {
    return { gigs: [], error: { message: err.message || "Failed to fetch gigs." } };
  }
};

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

/**
 * Updates an existing gig. Only the owning student may update (enforced by RLS).
 *
 * @param {string}        gigId
 * @param {Partial<Gig>}  updates  — only the fields you want to change
 * @returns {Promise<{ gig: Gig|null, error: object|null }>}
 */
export const gigUpdate = async (gigId, updates) => {
  try {
    if (!gigId) {
      return { gig: null, error: { message: "Gig ID is required." } };
    }

    // Validate only the fields being updated that we care about
    if (updates.title !== undefined || updates.description !== undefined || updates.category !== undefined) {
      const partial = {
        title:       updates.title       ?? "__skip__",
        description: updates.description ?? "__skip__",
        category:    updates.category    ?? "placeholder",
        packages:    updates.packages    ?? [{}],
      };

      // Only run relevant validations
      if (updates.title !== undefined && partial.title.trim().length < 5) {
        return { gig: null, error: { message: "Title must be at least 5 characters." } };
      }
      if (updates.description !== undefined && partial.description.trim().length < 20) {
        return { gig: null, error: { message: "Description must be at least 20 characters." } };
      }
    }

    // Strip read-only fields from the payload
    const { id, student_id, created_at, total_orders, total_reviews, rating, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from("gigs")
      .update(safeUpdates)
      .eq("id", gigId)
      .select()
      .single();

    if (error) return { gig: null, error };
    return { gig: data, error: null };
  } catch (err) {
    return { gig: null, error: { message: err.message || "Failed to update gig." } };
  }
};

// ---------------------------------------------------------------------------
// TOGGLE STATUS (pause / activate)
// ---------------------------------------------------------------------------

/**
 * Toggles a gig between 'active' and 'paused' status.
 *
 * @param {string}    gigId
 * @param {GigStatus} newStatus  — 'active' | 'paused' | 'draft'
 * @returns {Promise<{ gig: Gig|null, error: object|null }>}
 */
export const gigSetStatus = async (gigId, newStatus) => {
  const allowed = ["active", "paused", "draft"];
  if (!allowed.includes(newStatus)) {
    return { gig: null, error: { message: `Invalid status: ${newStatus}` } };
  }
  return gigUpdate(gigId, { status: newStatus });
};

// ---------------------------------------------------------------------------
// DELETE (soft delete)
// ---------------------------------------------------------------------------

/**
 * Soft-deletes a gig by setting its status to 'deleted'.
 * The row is preserved in the database for audit purposes.
 * Use gigHardDelete() only when a full wipe is required.
 *
 * @param {string} gigId
 * @returns {Promise<{ success: boolean, error: object|null }>}
 */
export const gigDelete = async (gigId) => {
  try {
    if (!gigId) {
      return { success: false, error: { message: "Gig ID is required." } };
    }

    const { error } = await supabase
      .from("gigs")
      .update({ status: "deleted" })
      .eq("id", gigId);

    if (error) return { success: false, error };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: { message: err.message || "Failed to delete gig." } };
  }
};

/**
 * Hard-deletes a gig row from the database.
 * Prefer gigDelete() (soft delete) in normal usage.
 *
 * @param {string} gigId
 * @returns {Promise<{ success: boolean, error: object|null }>}
 */
export const gigHardDelete = async (gigId) => {
  try {
    if (!gigId) {
      return { success: false, error: { message: "Gig ID is required." } };
    }

    const { error } = await supabase
      .from("gigs")
      .delete()
      .eq("id", gigId);

    if (error) return { success: false, error };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: { message: err.message || "Failed to delete gig." } };
  }
};

// ---------------------------------------------------------------------------
// UPLOAD cover image
// ---------------------------------------------------------------------------

/**
 * Uploads a cover image to Supabase Storage and returns its public URL.
 * Requires a 'gig-covers' bucket to exist (see SQL comment in migration).
 *
 * @param {File}   file
 * @param {string} studentId
 * @returns {Promise<{ url: string|null, error: object|null }>}
 */
export const gigUploadCoverImage = async (file, studentId) => {
  try {
    if (!file) return { url: null, error: { message: "No file provided." } };

    const ext      = file.name.split(".").pop();
    const fileName = `${studentId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("gig-covers")
      .upload(fileName, file, { upsert: true, contentType: file.type });

    if (uploadError) return { url: null, error: uploadError };

    const { data } = supabase.storage
      .from("gig-covers")
      .getPublicUrl(fileName);

    return { url: data.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: { message: err.message || "Image upload failed." } };
  }
};