/**
 * Comment API — Supabase CRUD for gig comments with likes
 * Allows users to comment on gigs and like comments.
 */

import supabase from "@/lib/supabaseClient";

// ---------------------------------------------------------------------------
// CREATE — Add a comment to a gig
// ---------------------------------------------------------------------------

/**
 * Add a comment to a gig.
 *
 * @param {{
 *   gig_id:    string,
 *   content:   string,
 *   parent_id?: string,  // for replies
 * }} params
 * @returns {Promise<{ comment: object|null, error: object|null }>}
 */
export const commentCreate = async (params) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { comment: null, error: { message: "Not authenticated." } };

    const { gig_id, content, parent_id = null } = params;

    if (!gig_id) return { comment: null, error: { message: "Gig ID required." } };
    if (!content?.trim()) return { comment: null, error: { message: "Comment content required." } };
    if (content.trim().length > 5000) {
      return { comment: null, error: { message: "Comment too long (max 5000 chars)." } };
    }

    const { data, error } = await supabase
      .from("gig_comments")
      .insert({
        gig_id,
        user_id: user.id,
        content: content.trim(),
        parent_id: parent_id || null,
      })
      .select()
      .single();

    if (error) return { comment: null, error };

    // Fetch user profile info for the response
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("full_name, profile_image_url")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("full_name, profile_image_url")
      .eq("user_id", user.id)
      .maybeSingle();

    const userName = profile?.full_name || clientProfile?.full_name || user.email?.split("@")[0] || "User";
    const userAvatar = profile?.profile_image_url || clientProfile?.profile_image_url || null;

    return {
      comment: {
        ...data,
        user_full_name: userName,
        user_avatar_url: userAvatar,
        user_role: profile ? "student" : "client",
        like_count: 0,
        is_liked: false,
      },
      error: null,
    };
  } catch (err) {
    return { comment: null, error: { message: err.message || "Failed to add comment." } };
  }
};

// ---------------------------------------------------------------------------
// READ — Get comments for a gig
// ---------------------------------------------------------------------------

/**
 * Get top-level comments for a gig (ordered by newest first),
 * each with nested replies and like counts.
 *
 * @param {string} gigId
 * @returns {Promise<{ comments: object[], error: object|null }>}
 */
export const commentGetByGig = async (gigId) => {
  try {
    if (!gigId) return { comments: [], error: { message: "Gig ID required." } };

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Get all comments for this gig
    const { data: allComments, error } = await supabase
      .from("gig_comments")
      .select("*")
      .eq("gig_id", gigId)
      .order("created_at", { ascending: false });

    if (error) return { comments: [], error };

    if (!allComments?.length) return { comments: [], error: null };

    // Get all comment IDs
    const commentIds = allComments.map((c) => c.id);

    // Get like counts
    const { data: likeData } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .in("comment_id", commentIds);

    const likeCounts = {};
    (likeData ?? []).forEach((l) => {
      likeCounts[l.comment_id] = (likeCounts[l.comment_id] || 0) + 1;
    });

    // Check if current user liked each comment
    let userLikes = new Set();
    if (userId) {
      const { data: userLikeData } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds)
        .eq("user_id", userId);

      userLikes = new Set((userLikeData ?? []).map((l) => l.comment_id));
    }

    // Get user profiles for unique user IDs
    const userIds = [...new Set(allComments.map((c) => c.user_id))];
    const { data: studentProfiles } = await supabase
      .from("student_profiles")
      .select("user_id, full_name, profile_image_url")
      .in("user_id", userIds);

    const { data: clientProfiles } = await supabase
      .from("client_profiles")
      .select("user_id, full_name, profile_image_url")
      .in("user_id", userIds);

    const profileMap = {};
    (studentProfiles ?? []).forEach((p) => {
      profileMap[p.user_id] = { ...p, role: "student" };
    });
    (clientProfiles ?? []).forEach((p) => {
      if (!profileMap[p.user_id]) profileMap[p.user_id] = { ...p, role: "client" };
    });

    // Enrich comments
    const enriched = allComments.map((c) => ({
      ...c,
      user_full_name: profileMap[c.user_id]?.full_name || "User",
      user_avatar_url: profileMap[c.user_id]?.profile_image_url || null,
      user_role: profileMap[c.user_id]?.role || "user",
      like_count: likeCounts[c.id] || 0,
      is_liked: userLikes.has(c.id),
    }));

    // Separate top-level and replies
    const topLevel = enriched.filter((c) => !c.parent_id);
    const replies = enriched.filter((c) => c.parent_id);

    // Nest replies under parent comments
    const nestedComments = topLevel.map((parent) => ({
      ...parent,
      replies: replies
        .filter((r) => r.parent_id === parent.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }));

    return { comments: nestedComments, error: null };
  } catch (err) {
    return { comments: [], error: { message: err.message || "Failed to fetch comments." } };
  }
};

// ---------------------------------------------------------------------------
// UPDATE — Edit a comment
// ---------------------------------------------------------------------------

/**
 * Edit a comment (only by the original author).
 *
 * @param {string} commentId
 * @param {string} content
 * @returns {Promise<{ comment: object|null, error: object|null }>}
 */
export const commentUpdate = async (commentId, content) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { comment: null, error: { message: "Not authenticated." } };

    if (!commentId) return { comment: null, error: { message: "Comment ID required." } };
    if (!content?.trim()) return { comment: null, error: { message: "Content required." } };

    const { data, error } = await supabase
      .from("gig_comments")
      .update({ content: content.trim(), is_edited: true })
      .eq("id", commentId)
      .eq("user_id", user.id) // only own comments
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { comment: null, error: { message: "Comment not found or not yours." } };
      }
      return { comment: null, error };
    }
    return { comment: data, error: null };
  } catch (err) {
    return { comment: null, error: { message: err.message || "Failed to update comment." } };
  }
};

// ---------------------------------------------------------------------------
// DELETE — Delete a comment (cascades to replies via FK)
// ---------------------------------------------------------------------------

/**
 * Delete a comment (only by the original author).
 *
 * @param {string} commentId
 * @returns {Promise<{ success: boolean, error: object|null }>}
 */
export const commentDelete = async (commentId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { success: false, error: { message: "Not authenticated." } };

    if (!commentId) return { success: false, error: { message: "Comment ID required." } };

    const { error } = await supabase
      .from("gig_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id); // only own comments

    if (error) return { success: false, error };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: { message: err.message || "Failed to delete comment." } };
  }
};

// ---------------------------------------------------------------------------
// LIKE — Toggle like on a comment
// ---------------------------------------------------------------------------

/**
 * Toggle like on a comment.
 *
 * @param {string} commentId
 * @returns {Promise<{ liked: boolean, like_count: number, error: object|null }>}
 */
export const commentToggleLike = async (commentId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { liked: false, like_count: 0, error: { message: "Not authenticated." } };

    if (!commentId) {
      return { liked: false, like_count: 0, error: { message: "Comment ID required." } };
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);

      if (deleteError) return { liked: false, like_count: 0, error: deleteError };

      // Get new count
      const { count } = await supabase
        .from("comment_likes")
        .select("*", { count: "exact", head: true })
        .eq("comment_id", commentId);

      return { liked: false, like_count: count || 0, error: null };
    } else {
      // Like
      const { error: insertError } = await supabase
        .from("comment_likes")
        .insert({ comment_id: commentId, user_id: user.id });

      if (insertError) return { liked: false, like_count: 0, error: insertError };

      const { count } = await supabase
        .from("comment_likes")
        .select("*", { count: "exact", head: true })
        .eq("comment_id", commentId);

      return { liked: true, like_count: count || 0, error: null };
    }
  } catch (err) {
    return { liked: false, like_count: 0, error: { message: err.message || "Failed to toggle like." } };
  }
};

/**
 * Get like count for a comment.
 *
 * @param {string} commentId
 * @returns {Promise<{ count: number, error: object|null }>}
 */
export const commentGetLikeCount = async (commentId) => {
  try {
    if (!commentId) return { count: 0, error: { message: "Comment ID required." } };

    const { count, error } = await supabase
      .from("comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId);

    if (error) return { count: 0, error };
    return { count: count || 0, error: null };
  } catch (err) {
    return { count: 0, error: { message: err.message || "Failed to get like count." } };
  }
};