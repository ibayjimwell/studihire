/**
 * Database Utilities for Student Verifications
 * Handles CRUD operations for student submissions and verifications
 */

import supabase from "@/lib/supabaseClient";

/**
 * Create new student submission for verification
 * @param {string} userId - User ID
 * @param {object} submissionData - Submission data
 * @returns {Promise<{data, error}>}
 */
export const createStudentSubmission = async (userId, submissionData) => {
  try {
    if (!userId) {
      return { data: null, error: { message: "User ID is required" } };
    }

    const { data, error } = await supabase
      .from("student_submissions")
      .insert([
        {
          user_id: userId,
          ...submissionData,
          submission_status: "draft",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || "Failed to create submission" },
    };
  }
};

/**
 * Get student submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<{data, error}>}
 */
export const getStudentSubmission = async (submissionId) => {
  try {
    if (!submissionId) {
      return { data: null, error: { message: "Submission ID is required" } };
    }

    const { data, error } = await supabase
      .from("student_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || "Failed to fetch submission" },
    };
  }
};

/**
 * Get student's latest submission
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export const getStudentLatestSubmission = async (userId) => {
  try {
    if (!userId) {
      return { data: null, error: { message: "User ID is required" } };
    }

    const { data, error } = await supabase
      .from("student_submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return { data: null, error };
    }

    return { data: data || null, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error.message || "Failed to fetch latest submission",
      },
    };
  }
};

/**
 * Update student submission
 * @param {string} submissionId - Submission ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{data, error}>}
 */
export const updateStudentSubmission = async (submissionId, updates) => {
  try {
    if (!submissionId) {
      return { data: null, error: { message: "Submission ID is required" } };
    }

    const { data, error } = await supabase
      .from("student_submissions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || "Failed to update submission" },
    };
  }
};

/**
 * Submit student verification (change status from draft to submitted)
 * @param {string} submissionId - Submission ID
 * @returns {Promise<{data, error}>}
 */
export const submitStudentVerification = async (submissionId) => {
  try {
    if (!submissionId) {
      return { data: null, error: { message: "Submission ID is required" } };
    }

    const { data, error } = await supabase
      .from("student_submissions")
      .update({
        submission_status: "submitted",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || "Failed to submit verification" },
    };
  }
};

/**
 * Get all pending submissions for admin review
 * @returns {Promise<{data, error}>}
 */
export const getPendingSubmissions = async () => {
  try {
    const { data, error } = await supabase
      .from("student_submissions")
      .select("*, student_profiles:user_id(*)")
      .in("submission_status", ["submitted", "under_review", "needs_revision"])
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error.message || "Failed to fetch pending submissions",
      },
    };
  }
};

/**
 * Get submissions assigned to specific admin
 * @param {string} adminId - Admin user ID
 * @returns {Promise<{data, error}>}
 */
export const getSubmissionsByAdmin = async (adminId) => {
  try {
    if (!adminId) {
      return { data: null, error: { message: "Admin ID is required" } };
    }

    const { data, error } = await supabase
      .from("student_submissions")
      .select("*, student_profiles:user_id(*)")
      .eq("assigned_admin_id", adminId)
      .in("submission_status", ["under_review", "needs_revision"])
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error.message || "Failed to fetch admin submissions",
      },
    };
  }
};

/**
 * Create admin review
 * @param {string} submissionId - Submission ID
 * @param {string} adminId - Admin user ID
 * @param {object} reviewData - Review details
 * @returns {Promise<{data, error}>}
 */
export const createAdminReview = async (submissionId, adminId, reviewData) => {
  try {
    if (!submissionId || !adminId) {
      return {
        data: null,
        error: { message: "Submission ID and Admin ID are required" },
      };
    }

    const { data, error } = await supabase
      .from("admin_reviews")
      .insert([
        {
          submission_id: submissionId,
          admin_id: adminId,
          ...reviewData,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || "Failed to create review" },
    };
  }
};

/**
 * Update admin review
 * @param {string} reviewId - Review ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{data, error}>}
 */
export const updateAdminReview = async (reviewId, updates) => {
  try {
    if (!reviewId) {
      return { data: null, error: { message: "Review ID is required" } };
    }

    const { data, error } = await supabase
      .from("admin_reviews")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || "Failed to update review" },
    };
  }
};

/**
 * Approve student verification
 * @param {string} submissionId - Submission ID
 * @param {string} adminId - Admin user ID
 * @param {string} comments - Optional comments
 * @returns {Promise<{data, error}>}
 */
export const approveStudentSubmission = async (
  submissionId,
  adminId,
  comments = "",
) => {
  try {
    if (!submissionId || !adminId) {
      return {
        data: null,
        error: { message: "Submission ID and Admin ID are required" },
      };
    }

    // Update submission status
    const { data: updatedSubmission, error: submissionError } = await supabase
      .from("student_submissions")
      .update({
        submission_status: "approved",
        updated_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (submissionError) {
      return { data: null, error: submissionError };
    }

    // Create/update review
    await createAdminReview(submissionId, adminId, {
      review_status: "approved",
      comments,
      basic_info_verified: true,
      education_verified: true,
      skills_verified: true,
      experience_verified: true,
      documents_verified: true,
      student_id_verified: true,
    });

    return { data: updatedSubmission, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error.message || "Failed to approve submission",
      },
    };
  }
};

/**
 * Reject student verification
 * @param {string} submissionId - Submission ID
 * @param {string} adminId - Admin user ID
 * @param {string} rejectionReason - Reason for rejection
 * @param {string} comments - Admin comments
 * @returns {Promise<{data, error}>}
 */
export const rejectStudentSubmission = async (
  submissionId,
  adminId,
  rejectionReason,
  comments = "",
) => {
  try {
    if (!submissionId || !adminId || !rejectionReason) {
      return {
        data: null,
        error: {
          message: "Submission ID, Admin ID, and rejection reason are required",
        },
      };
    }

    // Update submission status
    const { data: updatedSubmission, error: submissionError } = await supabase
      .from("student_submissions")
      .update({
        submission_status: "rejected",
        rejected_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (submissionError) {
      return { data: null, error: submissionError };
    }

    // Create/update review
    await createAdminReview(submissionId, adminId, {
      review_status: "rejected",
      rejection_reason: rejectionReason,
      comments,
    });

    return { data: updatedSubmission, error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || "Failed to reject submission" },
    };
  }
};

/**
 * Get student profile from student_profiles table
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>}
 */
export const getStudentProfile = async (userId) => {
  try {
    if (!userId) {
      return {
        data: null,
        error: { message: "User ID is required" },
      };
    }

    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return { data: data || null, error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || "Failed to fetch student profile" },
    };
  }
};

/**
 * Update student profile
 * @param {string} userId - User ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{data, error}>}
 */
export const updateStudentProfile = async (userId, updates) => {
  try {
    if (!userId) {
      return {
        data: null,
        error: { message: "User ID is required" },
      };
    }

    const { data, error } = await supabase
      .from("student_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error.message || "Failed to update student profile",
      },
    };
  }
};

/**
 * Count pending verifications (for admin dashboard)
 * @returns {Promise<{count, error}>}
 */
export const countPendingVerifications = async () => {
  try {
    const { count, error } = await supabase
      .from("student_submissions")
      .select("*", { count: "exact", head: true })
      .in("submission_status", ["submitted", "under_review"]);

    if (error) {
      return { count: null, error };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    return {
      count: null,
      error: {
        message: error.message || "Failed to count pending verifications",
      },
    };
  }
};
