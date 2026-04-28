/**
 * Resume Parsing Utilities
 * Handles PDF text extraction and AI-based resume analysis.
 *
 * FIX: pdfjs-dist worker is now imported directly from the installed package
 * so Vite bundles it as a local asset — no CDN, no version mismatch, no CORS.
 */

// ---------------------------------------------------------------------------
// pdfjs worker — import from the local package, not from unpkg
// ---------------------------------------------------------------------------
import * as pdfjsLib from "pdfjs-dist";

// This import resolves to node_modules/pdfjs-dist/build/pdf.worker.min.mjs.
// Vite handles it as a URL reference (static asset) when using `?url`.
// If you are on pdfjs-dist ≥ 4.x, `?url` suffix is required.
// If the line below causes a build error, try the alternative commented out beneath it.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
// Alternative for older pdfjs-dist (2.x / 3.x):
// import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// ---------------------------------------------------------------------------
// AI config
// ---------------------------------------------------------------------------
const AI_CONFIG = {
  API_URL:     "https://openrouter.ai/api/v1/chat/completions",
  MODEL:       "openrouter/free",
  TEMPERATURE: 0.3,
  MAX_TOKENS:  4000,
  TOP_P:       0.95,
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
const RESUME_ANALYSIS_SYSTEM_PROMPT = `You are a professional resume parser. Extract structured information from the resume into JSON.

RULES:
1. Extract ONLY factual information present in the resume.
2. Return ONLY valid JSON — no markdown, no code fences, no extra text.
3. Use null for missing fields and [] for missing arrays.
4. For dates, use ISO format (YYYY-MM-DD) when possible.

JSON STRUCTURE:
{
  "personal_info": {
    "full_name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "professional_summary": "string or null",
    "extracted_confidence": 0.0
  },
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field_of_study": "string",
      "graduation_date": "YYYY or null",
      "gpa": "string or null",
      "honors": "string or null"
    }
  ],
  "skills": {
    "technical": [],
    "soft": [],
    "languages": [],
    "tools_and_platforms": [],
    "other": []
  },
  "experience": [
    {
      "job_title": "string",
      "company": "string",
      "start_date": "YYYY or null",
      "end_date": "YYYY or null",
      "is_current": false,
      "duration_months": null,
      "description": "string or null",
      "responsibilities": [],
      "achievements": []
    }
  ],
  "certifications": [],
  "projects": [],
  "summary": {
    "total_experience_years": null,
    "highest_education_level": "string",
    "key_skills": [],
    "industries": [],
    "job_titles_history": [],
    "parsing_notes": "string"
  }
}`;

// ---------------------------------------------------------------------------
// PDF text extraction — reliable, bundled worker
// ---------------------------------------------------------------------------

/**
 * Extracts plain text from a PDF, DOCX, or TXT File object.
 *
 * @param {File} file
 * @returns {Promise<string>} — extracted text (throws on failure)
 */
export const extractResumeText = async (file) => {
  if (!file) throw new Error("No file provided.");

  // ── Plain text ─────────────────────────────────────────────────────────
  if (file.type === "text/plain" || file.type === "text/rtf") {
    return file.text();
  }

  // ── PDF ────────────────────────────────────────────────────────────────
  if (file.type === "application/pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Load document — worker is already configured above via the module-level import
      const pdf = await pdfjsLib.getDocument({
        data:             new Uint8Array(arrayBuffer),
        useWorkerFetch:   false,
        isEvalSupported:  false,
        useSystemFonts:   true,
      }).promise;

      let text = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page        = await pdf.getPage(pageNum);
        const content     = await page.getTextContent();
        const pageText    = content.items.map((item) => item.str).join(" ");
        text             += pageText + "\n";
      }

      const trimmed = text.trim();
      if (!trimmed) throw new Error("PDF appears to be empty or image-only.");
      return trimmed;
    } catch (err) {
      // Re-throw with a cleaner message
      throw new Error(`PDF extraction failed: ${err.message}`);
    }
  }

  // ── Word / other — best-effort ─────────────────────────────────────────
  try {
    const text = await file.text();
    if (!text.trim()) throw new Error("No readable text found in file.");
    return text;
  } catch {
    throw new Error(
      `File type "${file.type}" is not supported. Please upload a PDF or TXT file.`
    );
  }
};

// ---------------------------------------------------------------------------
// AI resume parsing via OpenRouter
// ---------------------------------------------------------------------------

/**
 * Sends extracted resume text to the AI and returns structured JSON.
 *
 * @param {string} resumeText
 * @returns {Promise<{ parsed_data: object|null, confidence: number, error: object|null }>}
 */
export const parseResume = async (resumeText) => {
  if (!resumeText?.trim()) {
    return { parsed_data: null, confidence: 0, error: { message: "Resume text is empty." } };
  }

  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) {
    return {
      parsed_data: null,
      confidence:  0,
      error:       { message: "AI API key not configured. Add VITE_AI_API_KEY to your .env file." },
    };
  }

  try {
    const response = await fetch(AI_CONFIG.API_URL, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title":      "StudiHire",
      },
      body: JSON.stringify({
        model:       AI_CONFIG.MODEL,
        temperature: AI_CONFIG.TEMPERATURE,
        max_tokens:  AI_CONFIG.MAX_TOKENS,
        top_p:       AI_CONFIG.TOP_P,
        messages: [
          { role: "system", content: RESUME_ANALYSIS_SYSTEM_PROMPT },
          {
            role:    "user",
            content: `Analyze this resume and return ONLY JSON:\n\n---\n${resumeText}\n---`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      if (response.status === 402) {
        return {
          parsed_data: null,
          confidence:  0,
          error: {
            message: "Insufficient AI API balance. Check your OpenRouter account.",
            code:    "insufficient_balance",
          },
        };
      }
      return {
        parsed_data: null,
        confidence:  0,
        error: { message: `AI API error ${response.status}: ${body.slice(0, 200)}` },
      };
    }

    const data       = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return { parsed_data: null, confidence: 0, error: { message: "No response from AI." } };
    }

    // Strip markdown fences if the model wrapped the JSON anyway
    const cleaned = aiResponse
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsedJSON;
    try {
      parsedJSON = JSON.parse(cleaned);
    } catch {
      return {
        parsed_data: null,
        confidence:  0,
        error: { message: "AI returned invalid JSON. You can fill the form manually." },
      };
    }

    const confidence = parsedJSON.personal_info?.extracted_confidence ?? 0.8;
    return { parsed_data: parsedJSON, confidence, error: null };
  } catch (err) {
    return {
      parsed_data: null,
      confidence:  0,
      error: { message: err.message || "Unexpected error during AI parsing." },
    };
  }
};

// ---------------------------------------------------------------------------
// Map AI output → onboarding form fields
// ---------------------------------------------------------------------------

/**
 * Converts the AI-parsed resume JSON into the shape the onboarding form expects.
 *
 * @param {object} parsedData
 * @returns {object}
 */
export const mapParsedResumeToFormData = (parsedData) => {
  if (!parsedData) return {};

  return {
    full_name:           parsedData.personal_info?.full_name            ?? "",
    email:               parsedData.personal_info?.email                ?? "",
    phone_number:        parsedData.personal_info?.phone                ?? "",
    location:            parsedData.personal_info?.location             ?? "",
    bio:                 parsedData.personal_info?.professional_summary ?? "",
    education_level:     parsedData.summary?.highest_education_level    ?? "Not specified",
    years_of_experience: parsedData.summary?.total_experience_years     ?? 0,
    experience:          parsedData.experience                          ?? [],
    skills: {
      technical: parsedData.skills?.technical          ?? [],
      soft:      parsedData.skills?.soft               ?? [],
      languages: parsedData.skills?.languages          ?? [],
      tools:     parsedData.skills?.tools_and_platforms ?? [],
    },
    certifications: parsedData.certifications ?? [],
    projects:       parsedData.projects       ?? [],
  };
};

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

/**
 * Basic structural validation of the parsed resume object.
 *
 * @param {object} parsedData
 * @returns {boolean}
 */
export const validateParsedResumeStructure = (parsedData) => {
  if (!parsedData || typeof parsedData !== "object") return false;
  return ["personal_info", "education", "skills", "experience", "summary"]
    .every((field) => field in parsedData);
};

// Re-export prompts/config for any external use
export { AI_CONFIG, RESUME_ANALYSIS_SYSTEM_PROMPT };