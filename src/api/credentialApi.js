/**
 * Credential API — Supabase CRUD for student credentials
 * Students add certificates, awards, badges, and licenses.
 * Credentials power the credential-based filtering in gig browsing.
 *
 * Scoring algorithm (without LLM):
 * - File type: PDF/Image with text extraction preferred
 * - Issuer reputation: known educational/tech institutions get bonus
 * - Text analysis: matching skills/keywords boost validity
 * - Admin verification: is_verified = true gives max score
 */

import supabase from "@/lib/supabaseClient";

const CREDENTIALS_BUCKET = "credentials";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// ── Issuer reputation scoring ──────────────────────────────────────────────
const KNOWN_ISSUERS = [
  "coursera", "edx", "udemy", "udacity", "linkedin", "pluralsight",
  "google", "microsoft", "aws", "amazon", "cisco", "oracle", "ibm",
  "harvard", "mit", "stanford", "oxford", "cambridge", "upenn",
  "university", "college", "institute", "school", "academy",
];

function calculateValidityScore(credential) {
  let score = 0;

  // Base score for having core fields
  if (credential.title?.trim()) score += 10;
  if (credential.issuer?.trim()) score += 10;
  if (credential.description?.trim()) score += 5;
  if (credential.file_url) score += 15;

  // Issuer reputation bonus
  if (credential.issuer) {
    const issuerLower = credential.issuer.toLowerCase();
    for (const known of KNOWN_ISSUERS) {
      if (issuerLower.includes(known)) {
        score += 15;
        break;
      }
    }
  }

  // Extracted text bonus
  if (credential.extracted_text?.trim()) {
    score += 10;
    // More text = more likely genuine
    if (credential.extracted_text.length > 200) score += 5;
    if (credential.extracted_text.length > 500) score += 5;
  }

  // AI verification bonus
  if (credential.ai_verified) {
    score += Math.round((credential.ai_confidence || 50) * 0.2);
  }

  // Admin verification = max confidence
  if (credential.is_verified) {
    score = 100;
  }

  return Math.min(100, Math.max(0, score));
}

// Simple UUID generator
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// ---------------------------------------------------------------------------
// CREATE — Add a new credential
// ---------------------------------------------------------------------------

/**
 * Add a new credential for the authenticated student.
 *
 * @param {{
 *   title:        string,
 *   issuer?:      string,
 *   description?: string,
 *   category?:    'certificate'|'award'|'badge'|'license'|'other',
 *   file?:        File,
 *   extracted_text?: string,
 * }} params
 * @returns {Promise<{ credential: object|null, error: object|null }>}
 */
export const credentialCreate = async (params) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { credential: null, error: { message: "Not authenticated." } };

    const { title, issuer = "", description = "", category = "certificate", file, extracted_text = "" } = params;

    if (!title?.trim()) return { credential: null, error: { message: "Title is required." } };

    let fileUrl = null;
    let thumbnailUrl = null;

    // Upload file if provided
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return { credential: null, error: { message: "File exceeds 20MB limit." } };
      }

      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${generateId()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(CREDENTIALS_BUCKET)
        .upload(filePath, file, { upsert: false });

      if (uploadError) return { credential: null, error: uploadError };

      const { data: urlData } = supabase.storage
        .from(CREDENTIALS_BUCKET)
        .getPublicUrl(filePath);

      fileUrl = urlData.publicUrl;
      thumbnailUrl = fileUrl; // Could generate thumbnails with image transformation
    }

    const credentialData = {
      student_id: user.id,
      title: title.trim(),
      issuer: issuer.trim(),
      description: description.trim(),
      category,
      file_url: fileUrl,
      thumbnail_url: thumbnailUrl,
      extracted_text: extracted_text.trim(),
    };

    // Calculate validity score
    credentialData.validity_score = calculateValidityScore(credentialData);

    const { data, error } = await supabase
      .from("credentials")
      .insert(credentialData)
      .select()
      .single();

    if (error) return { credential: null, error };
    return { credential: data, error: null };
  } catch (err) {
    return { credential: null, error: { message: err.message || "Failed to create credential." } };
  }
};

// ---------------------------------------------------------------------------
// READ — Get credentials
// ---------------------------------------------------------------------------

/**
 * Get all credentials for a student.
 *
 * @param {string} studentId
 * @returns {Promise<{ credentials: object[], error: object|null }>}
 */
export const credentialGetByStudent = async (studentId) => {
  try {
    if (!studentId) return { credentials: [], error: { message: "Student ID required." } };

    const { data, error } = await supabase
      .from("credentials")
      .select("*")
      .eq("student_id", studentId)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) return { credentials: [], error };
    return { credentials: data ?? [], error: null };
  } catch (err) {
    return { credentials: [], error: { message: err.message || "Failed to fetch credentials." } };
  }
};

/**
 * Get own credentials (including private ones) for the authenticated student.
 *
 * @returns {Promise<{ credentials: object[], error: object|null }>}
 */
export const credentialGetMine = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { credentials: [], error: { message: "Not authenticated." } };

    const { data, error } = await supabase
      .from("credentials")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return { credentials: [], error };
    return { credentials: data ?? [], error: null };
  } catch (err) {
    return { credentials: [], error: { message: err.message || "Failed to fetch credentials." } };
  }
};

// ---------------------------------------------------------------------------
// UPDATE — Update credential
// ---------------------------------------------------------------------------

/**
 * Update a credential (only by owner).
 *
 * @param {string} credentialId
 * @param {object} updates
 * @returns {Promise<{ credential: object|null, error: object|null }>}
 */
export const credentialUpdate = async (credentialId, updates) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { credential: null, error: { message: "Not authenticated." } };

    const safeFields = ["title", "issuer", "description", "category", "extracted_text", "is_public"];
    const safe = {};
    Object.entries(updates).forEach(([k, v]) => {
      if (safeFields.includes(k)) safe[k] = v;
    });

    if (Object.keys(safe).length === 0) {
      return { credential: null, error: { message: "No editable fields provided." } };
    }

    // Recalculate score if core fields changed
    if (safe.title || safe.issuer || safe.description || safe.extracted_text) {
      const { data: existing } = await supabase
        .from("credentials")
        .select("*")
        .eq("id", credentialId)
        .single();

      if (existing) {
        safe.validity_score = calculateValidityScore({ ...existing, ...safe });
      }
    }

    const { data, error } = await supabase
      .from("credentials")
      .update(safe)
      .eq("id", credentialId)
      .eq("student_id", user.id)
      .select()
      .single();

    if (error) return { credential: null, error };
    return { credential: data, error: null };
  } catch (err) {
    return { credential: null, error: { message: err.message || "Failed to update credential." } };
  }
};

// ---------------------------------------------------------------------------
// DELETE — Delete a credential
// ---------------------------------------------------------------------------

/**
 * Delete a credential (only by owner).
 *
 * @param {string} credentialId
 * @returns {Promise<{ success: boolean, error: object|null }>}
 */
export const credentialDelete = async (credentialId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return { success: false, error: { message: "Not authenticated." } };

    const { error } = await supabase
      .from("credentials")
      .delete()
      .eq("id", credentialId)
      .eq("student_id", user.id);

    if (error) return { success: false, error };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: { message: err.message || "Failed to delete credential." } };
  }
};

// ---------------------------------------------------------------------------
// AI ANALYSIS — Extract text from credential file (OCR placeholder)
// ---------------------------------------------------------------------------

/**
 * Extract text from a credential file URL using Supabase/fetch.
 * In production, this would call an OCR service (e.g. Tesseract, Google Vision).
 * For now, returns a placeholder — the extracted text is provided by the user
 * or can be pasted manually.
 *
 * @param {string} fileUrl
 * @returns {Promise<{ text: string, error: object|null }>}
 */
export const credentialExtractText = async (fileUrl) => {
  // Placeholder: In production, integrate with:
  // - Tesseract.js (browser OCR)
  // - Google Cloud Vision API
  // - Supabase Edge Function with PDF parsing
  return { text: "", error: null };
};

// ---------------------------------------------------------------------------
// FILTER HELPER — Build credential-based filter for gig browsing
// ---------------------------------------------------------------------------

/**
 * Get credential-filtered student IDs.
 * Students with higher credential scores and relevant skills are preferred.
 * This is used by the GigsBrowse page for enhanced filtering.
 *
 * @param {{
 *   search?: string,
 *   min_credential_score?: number,
 *   skills?: string[],
 * }} options
 * @returns {Promise<{ studentIds: string[], error: object|null }>}
 */
export const credentialFilterStudents = async (options = {}) => {
  try {
    const { search = "", min_credential_score = 0, skills = [] } = options;

    let query = supabase
      .from("student_profiles")
      .select("user_id, credential_score, credential_count, skills")
      .gte("credential_score", min_credential_score)
      .order("credential_score", { ascending: false });

    // If search provided, try to match against credential extracted_text
    if (search.trim()) {
      // Search by credential text — this is an basic approach
      // In production, use pg_trgm or full-text search on extracted_text
      query = query.or(
        `full_name.ilike.%${search.trim()}%,skills.cs.{${search.trim()}}`
      );
    }

    // If skills provided, filter by skills overlap
    if (skills.length > 0) {
      // For each skill, check contains
      const skillFilters = skills.map((s) => `skills.cs.{${s}}`);
      query = query.or(skillFilters.join(","));
    }

    const { data, error } = await query;

    if (error) return { studentIds: [], error };
    return { studentIds: (data ?? []).map((p) => p.user_id), error: null };
  } catch (err) {
    return { studentIds: [], error: { message: err.message || "Failed to filter students." } };
  }
};