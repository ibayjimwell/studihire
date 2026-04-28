// @ts-nocheck
import supabase from "@/lib/supabaseClient";

// ── Submissions ──────────────────────────────────

export const createClientSubmission = async (userId, data = {}) => {
  if (!userId) return { data: null, error: { message: "User ID required" } };
  const { data: sub, error } = await supabase
    .from("client_submissions")
    .insert([{ user_id: userId, ...data, submission_status: "draft" }])
    .select()
    .single();
  return { data: sub, error };
};

export const getClientLatestSubmission = async (userId) => {
  if (!userId) return { data: null, error: { message: "User ID required" } };
  const { data, error } = await supabase
    .from("client_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== "PGRST116") return { data: null, error };
  return { data: data || null, error: null };
};

export const updateClientSubmission = async (submissionId, updates) => {
  if (!submissionId) return { data: null, error: { message: "Submission ID required" } };
  const { data, error } = await supabase
    .from("client_submissions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", submissionId)
    .select()
    .single();
  return { data, error };
};

export const submitClientVerification = async (submissionId) => {
  if (!submissionId) return { data: null, error: { message: "Submission ID required" } };
  return updateClientSubmission(submissionId, {
    submission_status: "submitted",
    submitted_at: new Date().toISOString(),
  });
};

// ── Profile ──────────────────────────────────────

export const getClientProfile = async (userId) => {
  if (!userId) return { data: null, error: { message: "User ID required" } };
  const { data, error } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { data, error };
};

export const updateClientProfile = async (userId, updates) => {
  if (!userId) return { data: null, error: { message: "User ID required" } };
  const { data: existing } = await supabase
    .from("client_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  const now = new Date().toISOString();
  if (existing) {
    const { data, error } = await supabase
      .from("client_profiles")
      .update({ ...updates, updated_at: now })
      .eq("user_id", userId)
      .select()
      .single();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from("client_profiles")
      .insert([{ user_id: userId, ...updates, created_at: now, updated_at: now }])
      .select()
      .single();
    return { data, error };
  }
};

// ── File upload (valid ID) ──────────────────────

export const uploadClientValidID = async (file, userId) => {
  if (!file || !userId) return { url: null, error: { message: "Missing file or user" } };
  const ext = file.name.split(".").pop();
  const fileName = `${userId}/valid_id.${ext}`;
  const { error } = await supabase.storage
    .from("client-ids")  // bucket must exist
    .upload(fileName, file, { upsert: true });
  if (error) return { url: null, error };
  const { data } = supabase.storage.from("client-ids").getPublicUrl(fileName);
  return { url: data.publicUrl, error: null };
};