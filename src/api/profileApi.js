/**
 * Profile API — Student profile read/update operations
 *
 * Real table columns (from actual DB):
 *
 * student_profiles:
 *   id, user_id, full_name, email, phone_number, location, bio,
 *   profile_image_url, verification_status, onboarding_completed,
 *   profile_verified, created_at, updated_at, verified_at
 *
 * student_submissions:
 *   id, user_id, full_name, email, phone_number, location, bio,
 *   education_level, institution, graduation_year, field_of_study,
 *   skills (text[]), experience (text), years_of_experience,
 *   resume_url, student_id_url, submission_status,
 *   admin_comments, rejected_reason, submitted_at, reviewed_at, verified_at
 */

import supabase from "@/lib/supabaseClient";

// ---------------------------------------------------------------------------
// READ — own profile row
// ---------------------------------------------------------------------------

/**
 * Fetches the authenticated student's profile row from student_profiles.
 * Returns null (not error) when the row doesn't exist yet.
 *
 * @returns {Promise<{ profile: object|null, error: object|null }>}
 */
export const profileGetMine = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { profile: null, error: { message: "Not authenticated." } };

    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return { profile: null, error };
    return { profile: data, error: null };
  } catch (err) {
    return { profile: null, error: { message: err.message || "Failed to load profile." } };
  }
};

// ---------------------------------------------------------------------------
// READ — latest submitted/draft submission (for read-only academic info)
// ---------------------------------------------------------------------------

/**
 * Fetches the student's most recent submission.
 * Prioritises 'submitted' status so we always show the latest verified data,
 * falling back to any row ordered by created_at desc.
 *
 * @returns {Promise<{ submission: object|null, error: object|null }>}
 */
export const profileGetMySubmission = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { submission: null, error: { message: "Not authenticated." } };

    const { data, error } = await supabase
      .from("student_submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at",   { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { submission: null, error };
    return { submission: data, error: null };
  } catch (err) {
    return { submission: null, error: { message: err.message || "Failed to load submission." } };
  }
};

// ---------------------------------------------------------------------------
// READ — latest admin review for the student's submission
// ---------------------------------------------------------------------------

/**
 * Returns the most recent admin_review row for the student so they can
 * see rejection reasons and granular feedback.
 *
 * @param {string} submissionId
 * @returns {Promise<{ review: object|null, error: object|null }>}
 */
export const profileGetAdminReview = async (submissionId) => {
  try {
    if (!submissionId) return { review: null, error: null };

    const { data, error } = await supabase
      .from("admin_reviews")
      .select("review_status, comments, rejection_reason, reviewed_at")
      .eq("submission_id", submissionId)
      .order("reviewed_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) return { review: null, error };
    return { review: data, error: null };
  } catch (err) {
    return { review: null, error: { message: err.message || "Failed to load review." } };
  }
};

// ---------------------------------------------------------------------------
// UPDATE — editable fields only (bio, phone_number, location)
// Skills live in student_submissions (read-only from profile page).
// ---------------------------------------------------------------------------

/**
 * Updates the mutable fields on the student_profiles row.
 * Whitelist enforced — only bio, phone_number, location may be changed here.
 *
 * @param {{ bio?: string, phone_number?: string, location?: string }} updates
 * @returns {Promise<{ profile: object|null, error: object|null }>}
 */
export const profileUpdateEditable = async (updates) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { profile: null, error: { message: "Not authenticated." } };

    const EDITABLE = ["bio", "phone_number", "location"];
    const safe = Object.fromEntries(
      Object.entries(updates).filter(([k]) => EDITABLE.includes(k))
    );

    if (Object.keys(safe).length === 0)
      return { profile: null, error: { message: "No editable fields provided." } };

    const { data, error } = await supabase
      .from("student_profiles")
      .update(safe)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return { profile: null, error };
    return { profile: data, error: null };
  } catch (err) {
    return { profile: null, error: { message: err.message || "Failed to update profile." } };
  }
};

// ---------------------------------------------------------------------------
// UPLOAD — avatar / profile image
// Uses 'profile_image_url' column (actual column name in student_profiles)
// ---------------------------------------------------------------------------

/**
 * Uploads an avatar to the 'avatars' storage bucket and saves the public URL
 * to student_profiles.profile_image_url.
 *
 * @param {File}   file
 * @param {string} userId
 * @returns {Promise<{ url: string|null, error: object|null }>}
 */
export const profileUploadAvatar = async (file, userId) => {
  try {
    if (!file) return { url: null, error: { message: "No file provided." } };

    const ext      = file.name.split(".").pop();
    const fileName = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true, contentType: file.type });

    if (uploadError) return { url: null, error: uploadError };

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

    // Persist URL to profile
    const { error: updateError } = await supabase
      .from("student_profiles")
      .update({ profile_image_url: data.publicUrl })
      .eq("user_id", userId);

    if (updateError) return { url: null, error: updateError };

    return { url: data.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: { message: err.message || "Avatar upload failed." } };
  }
};