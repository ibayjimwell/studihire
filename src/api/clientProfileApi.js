// @ts-nocheck
import supabase from "@/lib/supabaseClient";

export const clientProfileGetMine = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { profile: null, error: { message: "Not authenticated." } };
  const { data, error } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return { profile: data, error };
};

export const clientProfileGetMySubmission = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { submission: null, error: { message: "Not authenticated." } };
  const { data, error } = await supabase
    .from("client_submissions")
    .select("*")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { submission: data, error };
};

export const clientProfileGetAdminReview = async (submissionId) => {
  if (!submissionId) return { review: null, error: null };
  const { data, error } = await supabase
    .from("admin_reviews")
    .select("review_status, comments, rejection_reason, reviewed_at")
    .eq("submission_id", submissionId)
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { review: data, error };
};

export const clientProfileUpdateEditable = async (updates) => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { profile: null, error: { message: "Not authenticated." } };
  const EDITABLE = ["bio", "phone_number", "location", "company_name", "industry", "website"];
  const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => EDITABLE.includes(k)));
  if (Object.keys(safe).length === 0) return { profile: null, error: { message: "No editable fields." } };
  const { data, error } = await supabase
    .from("client_profiles")
    .update(safe)
    .eq("user_id", user.id)
    .select()
    .single();
  return { profile: data, error };
};

export const clientProfileUploadAvatar = async (file, userId) => {
  if (!file) return { url: null, error: { message: "No file provided." } };
  const ext = file.name.split(".").pop();
  const fileName = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true, contentType: file.type });
  if (uploadError) return { url: null, error: uploadError };
  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  const { error: updateError } = await supabase
    .from("client_profiles")
    .update({ profile_image_url: data.publicUrl })
    .eq("user_id", userId);
  if (updateError) return { url: null, error: updateError };
  return { url: data.publicUrl, error: null };
};