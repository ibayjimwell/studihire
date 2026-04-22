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
// READ — single gig by id
// ---------------------------------------------------------------------------

/**
 * Fetches a single gig by its id.
 * The student can view their own gigs regardless of status.
 * Public viewers only see active gigs (enforced by RLS on the database).
 *
 * @param {string} gigId
 * @returns {Promise<{ gig: Gig|null, error: object|null }>}
 */
export const gigGetById = async (gigId) => {
  try {
    if (!gigId) {
      return { gig: null, error: { message: "Gig ID is required." } };
    }

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