/**
 * DeepSeek Resume Parsing Prompts and Utilities
 * Handles AI-based resume analysis and data extraction
 */

/**
 * System prompt for DeepSeek AI to analyze resume
 * Provides clear instructions on JSON structure and requirements
 */
export const RESUME_ANALYSIS_SYSTEM_PROMPT = `You are a professional resume parser and career counselor. Your task is to analyze a resume and extract structured information into a JSON format.

IMPORTANT INSTRUCTIONS:
1. Extract ONLY factual information from the resume
2. Be accurate and precise - if information is unclear, mark it as "not_found"
3. Return ONLY valid JSON, no markdown, no extra text
4. Do not make assumptions or infer information not in the resume
5. For dates, use ISO format (YYYY-MM-DD) when possible
6. For arrays, return empty array [] if not found

JSON STRUCTURE TO RETURN:
{
  "personal_info": {
    "full_name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "professional_summary": "string or null",
    "extracted_confidence": 0.0 to 1.0
  },
  "education": [
    {
      "institution": "string",
      "degree": "string (e.g., Bachelor of Science, Master's)",
      "field_of_study": "string",
      "graduation_date": "YYYY-MM-DD or null",
      "gpa": "string or null",
      "honors": "string or null"
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "languages": ["language1", "language2"],
    "tools_and_platforms": ["tool1", "tool2"],
    "other": ["skill1", "skill2"]
  },
  "experience": [
    {
      "job_title": "string",
      "company": "string",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null",
      "is_current": true/false,
      "duration_months": number or null,
      "description": "string",
      "responsibilities": ["responsibility1", "responsibility2"],
      "achievements": ["achievement1", "achievement2"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "issue_date": "YYYY-MM-DD or null",
      "expiry_date": "YYYY-MM-DD or null",
      "credential_id": "string or null",
      "credential_url": "string or null"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["tech1", "tech2"],
      "url": "string or null",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null"
    }
  ],
  "summary": {
    "total_experience_years": number or null,
    "highest_education_level": "string (e.g., Bachelor, Master, PhD)",
    "key_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "industries": ["industry1", "industry2"],
    "job_titles_history": ["title1", "title2", "title3"],
    "parsing_notes": "any additional notes or clarifications"
  }
}

Remember: Return ONLY the JSON. No explanations, no markdown, no additional text.`;

/**
 * User prompt template for sending resume content to DeepSeek
 */
export const RESUME_ANALYSIS_USER_PROMPT_TEMPLATE = (resumeText) => {
  return `Please analyze this resume and extract all information into the JSON structure I provided. Return ONLY valid JSON:

RESUME CONTENT:
---
${resumeText}
---

Return the extracted data as JSON only.`;
};

/**
 * Configuration for OpenRouter API (using gpt-oss-120b model)
 * OpenRouter provides access to various AI models including free ones
 */
export const AI_CONFIG = {
  API_URL: "https://openrouter.ai/api/v1/chat/completions",
  MODEL: "meta-llama/llama-3.1-70b-instruct", // Free model on OpenRouter
  TEMPERATURE: 0.3, // Lower temperature for more deterministic output
  MAX_TOKENS: 4000,
  TOP_P: 0.95,
};

/**
 * Extract text from resume PDF or document
 * @param {File} file - Resume file
 * @returns {Promise<string>} - Extracted text
 */
export const extractResumeText = async (file) => {
  try {
    // For PDF files, use pdfjs-dist library
    if (file.type === "application/pdf") {
      const pdfjsLib = await import("pdfjs-dist");
      
      // Set up the worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Extract text from all pages
      let fullText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
      }
      
      return fullText.trim();
    }

    // For text files
    if (file.type === "text/plain" || file.type === "text/rtf") {
      const text = await file.text();
      return text;
    }

    // For Word documents and other file types, attempt text extraction
    console.warn(
      `File type ${file.type} not fully supported. Attempting text extraction...`,
    );
    const text = await file.text();
    return text;
  } catch (error) {
    console.error("Error extracting resume text:", error);
    throw new Error("Failed to extract text from resume: " + error.message);
  }
};

/**
 * Parse resume using OpenRouter API (free models)
 * @param {string} resumeText - Resume text content
 * @returns {Promise<{parsed_data, confidence, error}>}
 */
export const parseResumeWithDeepSeek = async (resumeText) => {
  try {
    if (!resumeText || resumeText.trim().length === 0) {
      return {
        parsed_data: null,
        confidence: 0,
        error: { message: "Resume text is empty" },
      };
    }

    const apiKey = import.meta.env.VITE_AI_API_KEY;
    
    if (!apiKey) {
      return {
        parsed_data: null,
        confidence: 0,
        error: { message: "AI API key not configured. Please add VITE_AI_API_KEY to your .env file." },
      };
    }

    const requestBody = {
      model: AI_CONFIG.MODEL,
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: AI_CONFIG.TOP_P,
      messages: [
        {
          role: "system",
          content: RESUME_ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: RESUME_ANALYSIS_USER_PROMPT_TEMPLATE(resumeText),
        },
      ],
    };

    const response = await fetch(AI_CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:5173", // Required by OpenRouter
        "X-Title": "StudiHire", // Required by OpenRouter
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const error = JSON.parse(errorText);
        const errorMessage = error.error?.message || `AI API error: ${response.status}`;
        
        // Provide more helpful error messages for common issues
        if (response.status === 402) {
          return {
            parsed_data: null,
            confidence: 0,
            error: {
              message: "AI API: Insufficient balance. Please check your OpenRouter account.",
              code: "insufficient_balance"
            },
          };
        }
        
        return {
          parsed_data: null,
          confidence: 0,
          error: {
            message: errorMessage,
          },
        };
      } catch {
        return {
          parsed_data: null,
          confidence: 0,
          error: {
            message: `AI API error: ${response.status} - ${errorText.substring(0, 200)}`,
          },
        };
      }
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return {
        parsed_data: null,
        confidence: 0,
        error: { message: "No response from AI" },
      };
    }

    // Parse the JSON response
    let parsedJSON;
    try {
      // Clean the response in case it has markdown code blocks
      const cleanedResponse = aiResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      parsedJSON = JSON.parse(cleanedResponse);
    } catch (parseError) {
      return {
        parsed_data: null,
        confidence: 0,
        error: {
          message: "Failed to parse AI response as JSON",
        },
      };
    }

    // Extract confidence score from summary
    const confidence = parsedJSON.personal_info?.extracted_confidence || 0.8;

    return {
      parsed_data: parsedJSON,
      confidence,
      error: null,
    };
  } catch (error) {
    return {
      parsed_data: null,
      confidence: 0,
      error: {
        message: error.message || "Error parsing resume with AI",
      },
    };
  }
};

/**
 * Validate parsed resume data structure
 * @param {object} parsedData - Parsed resume data
 * @returns {boolean}
 */
export const validateParsedResumeStructure = (parsedData) => {
  if (!parsedData || typeof parsedData !== "object") return false;

  // Check required top-level fields
  const requiredFields = [
    "personal_info",
    "education",
    "skills",
    "experience",
    "summary",
  ];
  return requiredFields.every((field) => field in parsedData);
};

/**
 * Map parsed resume data to student submission form fields
 * @param {object} parsedData - Parsed resume data from DeepSeek
 * @returns {object} - Form-friendly data structure
 */
export const mapParsedResumeToFormData = (parsedData) => {
  if (!parsedData) return {};

  return {
    full_name:
      parsedData.personal_info?.full_name ||
      parsedData.summary?.personal_info?.full_name ||
      "",
    email: parsedData.personal_info?.email || "",
    phone_number: parsedData.personal_info?.phone || "",
    location: parsedData.personal_info?.location || "",
    bio: parsedData.personal_info?.professional_summary || "",
    education_level:
      parsedData.summary?.highest_education_level || "Not specified",
    experience: parsedData.experience,
    years_of_experience: parsedData.summary?.total_experience_years || 0,
    skills: {
      technical: parsedData.skills?.technical || [],
      soft: parsedData.skills?.soft || [],
      languages: parsedData.skills?.languages || [],
      tools: parsedData.skills?.tools_and_platforms || [],
    },
    certifications: parsedData.certifications || [],
    projects: parsedData.projects || [],
    summary: parsedData.summary?.key_skills || [],
  };
};
