/**
 * Verification API — Admin-side review operations
 *
 * Real table columns used:
 *
 * student_submissions:  submission_status, admin_comments, rejected_reason
 * admin_reviews:        submission_id, admin_id, review_status, comments,
 *                       rejection_reason, basic_info_verified, education_verified,
 *                       skills_verified, experience_verified, documents_verified,
 *                       student_id_verified, reviewed_at
 * student_profiles:     verification_status
 */

import supabase from "@/lib/supabaseClient";

// Mapping from admin_reviews.review_status → student_profiles.verification_status
// 'verified' is used because student_profiles has a check constraint that
// likely does NOT include 'approved'. Adjust if your constraint uses different values.
const REVIEW_TO_PROFILE_STATUS = {
  approved:        "verified",
  rejected:        "rejected",
  needs_revision:  "needs_revision",
};

// Mapping from admin_reviews.review_status → student_submissions.submission_status
// Adjust these if your check constraint uses different values.
const REVIEW_TO_SUBMISSION_STATUS = {
  approved:        "approved",   // change to "verified" if 400 persists
  rejected:        "rejected",
  needs_revision:  "needs_revision",
};

// ---------------------------------------------------------------------------
// READ — list submissions for the admin verifications page
// ---------------------------------------------------------------------------

/**
 * Fetches student_submissions for the admin queue.
 *
 * @param {{ status?: string }} [options]
 *   status: 'submitted' | 'approved' | 'rejected' | 'needs_revision' | 'all'
 * @returns {Promise<{ submissions: object[], error: object|null }>}
 */
export const verificationGetSubmissions = async (options = {}) => {
  try {
    const { status = "submitted" } = options;

    let query = supabase
      .from("student_submissions")
      .select("*")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at",   { ascending: false });

    if (status && status !== "all") {
      query = query.eq("submission_status", status);
    } else {
      // Exclude raw drafts that were never submitted
      query = query.neq("submission_status", "draft");
    }

    const { data, error } = await query;
    if (error) return { submissions: [], error };
    return { submissions: data ?? [], error: null };
  } catch (err) {
    return { submissions: [], error: { message: err.message || "Failed to load submissions." } };
  }
};

// ---------------------------------------------------------------------------
// READ — existing review for a submission (pre-fill dialog)
// ---------------------------------------------------------------------------

/**
 * Fetches the existing admin_reviews row for a submission if one exists.
 *
 * @param {string} submissionId
 * @returns {Promise<{ review: object|null, error: object|null }>}
 */
export const verificationGetReview = async (submissionId) => {
  try {
    if (!submissionId) return { review: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("admin_reviews")
      .select("*")
      .eq("submission_id", submissionId)
      .eq("admin_id", user.id)
      .maybeSingle();

    if (error) return { review: null, error };
    return { review: data, error: null };
  } catch (err) {
    return { review: null, error: { message: err.message || "Failed to load review." } };
  }
};

// ---------------------------------------------------------------------------
// DECIDE — approve / reject / request revision
// ---------------------------------------------------------------------------

/**
 * Records the admin's decision by:
 *   1. Upsert into admin_reviews (one review per admin per submission)
 *   2. Update student_submissions.submission_status
 *   3. Sync student_profiles.verification_status so the student sees it
 *
 * @param {{
 *   submissionId:       string,
 *   userId:             string,   // student's auth user_id
 *   decision:           'approved' | 'rejected' | 'needs_revision',
 *   comments?:          string,   // admin notes / feedback for the student
 *   rejectionReason?:   string,   // specific reason shown on rejected banner
 *   checklist?: {
 *     basicInfo?:      boolean,
 *     education?:      boolean,
 *     skills?:         boolean,
 *     experience?:     boolean,
 *     documents?:      boolean,
 *     studentId?:      boolean,
 *   }
 * }} params
 * @returns {Promise<{ success: boolean, error: object|null }>}
 */
export const verificationDecide = async ({
  submissionId,
  userId,
  decision,
  comments        = "",
  rejectionReason = "",
  checklist       = {},
}) => {
  try {
    const VALID = ["approved", "rejected", "needs_revision"];
    if (!VALID.includes(decision))
      return { success: false, error: { message: `Invalid decision: ${decision}` } };

    if (!submissionId || !userId)
      return { success: false, error: { message: "submissionId and userId are required." } };

    const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError || !admin)
      return { success: false, error: { message: "Admin not authenticated." } };

    const now = new Date().toISOString();

    // ── 1. Upsert admin_reviews ──────────────────────────────────────────
    const reviewPayload = {
      submission_id:        submissionId,
      admin_id:             admin.id,
      review_status:        decision,
      comments:             comments  || null,
      rejection_reason:     rejectionReason || null,
      basic_info_verified:  checklist.basicInfo   ?? false,
      education_verified:   checklist.education   ?? false,
      skills_verified:      checklist.skills       ?? false,
      experience_verified:  checklist.experience  ?? false,
      documents_verified:   checklist.documents   ?? false,
      student_id_verified:  checklist.studentId   ?? false,
      reviewed_at:          now,
      updated_at:           now,
    };

    const { error: reviewError } = await supabase
      .from("admin_reviews")
      .upsert(reviewPayload, {
        onConflict:     "submission_id,admin_id",
        ignoreDuplicates: false,
      });

    if (reviewError) return { success: false, error: reviewError };

    // ── 2. Update submission status + admin feedback columns ─────────────
    const submissionUpdate = {
      submission_status: REVIEW_TO_SUBMISSION_STATUS[decision],
      admin_comments:    comments        || null,
      rejected_reason:   rejectionReason || null,
      reviewed_at:       now,
    };
    if (decision === "approved") {
      submissionUpdate.verified_at = now;
    }

    const { error: submissionError } = await supabase
      .from("student_submissions")
      .update(submissionUpdate)
      .eq("id", submissionId);

    if (submissionError) return { success: false, error: submissionError };

    // ── 3. Sync to student_profiles ──────────────────────────────────────
    const profileUpdate = {
      verification_status: REVIEW_TO_PROFILE_STATUS[decision],
      updated_at:          now,
    };
    if (decision === "approved") {
      profileUpdate.profile_verified = true;
      profileUpdate.verified_at      = now;
    }

    const { error: profileError } = await supabase
      .from("student_profiles")
      .update(profileUpdate)
      .eq("user_id", userId);

    if (profileError) {
      // code 23514 = check_violation: the constraint doesn't allow this status value.
      // Fix: run fix_verification_status_constraint.sql in Supabase SQL Editor.
      // The decision is still committed in admin_reviews + student_submissions,
      // so we return success — Profile.jsx reads admin_reviews directly.
      if (profileError.code === "23514") {
        console.warn(
          `[verificationDecide] CHECK constraint blocked "${REVIEW_TO_PROFILE_STATUS[decision]}" ` +
          "on student_profiles. Run fix_verification_status_constraint.sql to resolve."
        );
        return { success: true, profileSyncFailed: true, error: null };
      }
      console.warn("student_profiles sync failed:", profileError.message);
    }

    return { success: true, profileSyncFailed: false, error: null };
  } catch (err) {
    return { success: false, error: { message: err.message || "Failed to record decision." } };
  }
};

// ---------------------------------------------------------------------------
// COUNTS — for the admin dashboard summary
// ---------------------------------------------------------------------------

/**
 * Returns submission counts grouped by status (excludes drafts).
 *
 * @returns {Promise<{ counts: Record<string,number>, error: object|null }>}
 */
export const verificationGetCounts = async () => {
  try {
    const { data, error } = await supabase
      .from("student_submissions")
      .select("submission_status")
      .neq("submission_status", "draft");

    if (error) return { counts: {}, error };

    const counts = (data ?? []).reduce((acc, row) => {
      acc[row.submission_status] = (acc[row.submission_status] || 0) + 1;
      return acc;
    }, {});

    return { counts, error: null };
  } catch (err) {
    return { counts: {}, error: { message: err.message || "Failed to load counts." } };
  }
};

// ---------------------------------------------------------------------------
// CLIENT SUBMISSION OPERATIONS
// ---------------------------------------------------------------------------

/**
 * Fetches client_submissions for the admin queue.
 */
export const verificationGetClientSubmissions = async (options = {}) => {
  try {
    const { status = "submitted" } = options;

    let query = supabase
      .from("client_submissions")
      .select("*")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at",   { ascending: false });

    if (status && status !== "all") {
      query = query.eq("submission_status", status);
    } else {
      query = query.neq("submission_status", "draft");
    }

    const { data, error } = await query;
    if (error) return { submissions: [], error };
    return { submissions: data ?? [], error: null };
  } catch (err) {
    return { submissions: [], error: { message: err.message || "Failed to load client submissions." } };
  }
};

/**
 * Records the admin's decision for a client submission.
 * Updates client_submissions and client_profiles.
 */
export const verificationDecideClient = async ({
  submissionId,
  userId,
  decision,
  comments        = "",
  rejectionReason = "",
}) => {
  try {
    const VALID = ["approved", "rejected", "needs_revision"];
    if (!VALID.includes(decision))
      return { success: false, error: { message: `Invalid decision: ${decision}` } };

    if (!submissionId || !userId)
      return { success: false, error: { message: "submissionId and userId are required." } };

    const { data: { user: admin }, error: authError } = await supabase.auth.getUser();
    if (authError || !admin)
      return { success: false, error: { message: "Admin not authenticated." } };

    const now = new Date().toISOString();

    // 1. Upsert admin_reviews (same table, no checklist now)
    const { error: reviewError } = await supabase
      .from("admin_reviews")
      .upsert(
        {
          submission_id:    submissionId,
          admin_id:         admin.id,
          review_status:    decision,
          comments:         comments || null,
          rejection_reason: rejectionReason || null,
          // We don't set individual verification flags
          reviewed_at:      now,
          updated_at:       now,
        },
        { onConflict: "submission_id,admin_id", ignoreDuplicates: false }
      );

    if (reviewError) return { success: false, error: reviewError };

    // 2. Update client_submissions status
    const { error: submissionError } = await supabase
      .from("client_submissions")
      .update({
        submission_status: REVIEW_TO_SUBMISSION_STATUS[decision],
        admin_comments:    comments || null,
        rejected_reason:   rejectionReason || null,
        reviewed_at:       now,
        ...(decision === "approved" && { verified_at: now }),
      })
      .eq("id", submissionId);

    if (submissionError) return { success: false, error: submissionError };

    // 3. Sync client_profile
    const profileStatus = REVIEW_TO_PROFILE_STATUS[decision];
    const { error: profileError } = await supabase
      .from("client_profiles")
      .update({
        verification_status: profileStatus,
        updated_at:          now,
        ...(decision === "approved" && {
          profile_verified: true,
          verified_at:      now,
        }),
      })
      .eq("user_id", userId);

    if (profileError) {
      // If constraint blocks, still return success (decision is recorded)
      console.warn("client_profiles sync failed:", profileError.message);
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: { message: err.message || "Failed to record decision." } };
  }
};

// ---------------------------------------------------------------------------
// COUNTS — include client submissions as well (optional)
// ---------------------------------------------------------------------------
export const verificationGetAllCounts = async () => {
  try {
    const [studentRes, clientRes] = await Promise.all([
      supabase.from("student_submissions").select("submission_status").neq("submission_status", "draft"),
      supabase.from("client_submissions").select("submission_status").neq("submission_status", "draft"),
    ]);

    const studentCounts = (studentRes.data ?? []).reduce((acc, r) => {
      acc[r.submission_status] = (acc[r.submission_status] || 0) + 1;
      return acc;
    }, {});
    const clientCounts = (clientRes.data ?? []).reduce((acc, r) => {
      acc[r.submission_status] = (acc[r.submission_status] || 0) + 1;
      return acc;
    }, {});

    return { counts: { student: studentCounts, client: clientCounts }, error: null };
  } catch (err) {
    return { counts: {}, error: { message: err.message } };
  }
};