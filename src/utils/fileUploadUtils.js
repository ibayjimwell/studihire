/**
 * File Upload Utilities for Supabase Storage
 * Handles resume, student ID, and other document uploads
 */

import supabase from "@/lib/supabaseClient";

/**
 * Configuration for file uploads
 */
export const UPLOAD_CONFIG = {
  RESUME_BUCKET: "student-resumes",
  STUDENT_ID_BUCKET: "student-ids",
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_RESUME_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  ALLOWED_ID_TYPES: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {string} type - File type ('resume' or 'student_id')
 * @returns {{valid: boolean, error: string | null}}
 */
export const validateFileUpload = (file, type = "resume") => {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  const fileConfig =
    type === "resume"
      ? {
          maxSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
          allowedTypes: UPLOAD_CONFIG.ALLOWED_RESUME_TYPES,
          typeName: "Resume",
        }
      : {
          maxSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
          allowedTypes: UPLOAD_CONFIG.ALLOWED_ID_TYPES,
          typeName: "Student ID",
        };

  // Check file size
  if (file.size > fileConfig.maxSize) {
    return {
      valid: false,
      error: `${fileConfig.typeName} file must be less than 10MB`,
    };
  }

  // Check file type
  if (!fileConfig.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid ${fileConfig.typeName} file type. Allowed: ${fileConfig.allowedTypes.join(", ")}`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Helper function to upload file to storage
 * Buckets must be created manually in Supabase Dashboard
 * @private
 */
const uploadFileToStorage = async (file, filePath, bucketName) => {
  // Validate inputs
  if (!file) {
    return { data: null, error: { message: "File is required" } };
  }
  
  if (!filePath) {
    return { data: null, error: { message: "File path is required" } };
  }
  
  if (!bucketName) {
    return { data: null, error: { message: "Bucket name is required" } };
  }

  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    // Return as-is, error will be handled by caller
    return { data, error };
  } catch (uploadError) {
    return { data: null, error: { message: uploadError.message || "Upload failed" } };
  }
};

/**
 * Upload resume file to Supabase storage
 * @param {File} file - Resume file
 * @param {string} userId - User ID
 * @returns {Promise<{url: string, path: string, error: object | null}>}
 */
export const uploadResume = async (file, userId) => {
  try {
    // Validate file
    const { valid, error: validationError } = validateFileUpload(
      file,
      "resume",
    );
    if (!valid) {
      return { url: null, path: null, error: { message: validationError } };
    }

    // Generate unique file name
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}_${timestamp}.${fileExt}`;
    const filePath = `resumes/${userId}/${fileName}`;

    // Upload to storage
    const { data, error } = await uploadFileToStorage(
      file,
      filePath,
      UPLOAD_CONFIG.RESUME_BUCKET,
    );

    if (error) {
      return {
        url: null,
        path: null,
        error: { message: error.message || "Failed to upload resume" },
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(UPLOAD_CONFIG.RESUME_BUCKET)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      error: null,
    };
  } catch (error) {
    return {
      url: null,
      path: null,
      error: {
        message: error.message || "Failed to upload resume",
      },
    };
  }
};

/**
 * Upload student ID image to Supabase storage
 * @param {File} file - Student ID file
 * @param {string} userId - User ID
 * @returns {Promise<{url: string, path: string, error: object | null}>}
 */
export const uploadStudentID = async (file, userId) => {
  try {
    // Validate file
    const { valid, error: validationError } = validateFileUpload(
      file,
      "student_id",
    );
    if (!valid) {
      return { url: null, path: null, error: { message: validationError } };
    }

    // Generate unique file name
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}_${timestamp}.${fileExt}`;
    const filePath = `student_ids/${userId}/${fileName}`;

    // Upload to storage
    const { data, error } = await uploadFileToStorage(
      file,
      filePath,
      UPLOAD_CONFIG.STUDENT_ID_BUCKET,
    );

    if (error) {
      return {
        url: null,
        path: null,
        error: { message: error.message || "Failed to upload student ID" },
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(UPLOAD_CONFIG.STUDENT_ID_BUCKET)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      error: null,
    };
  } catch (error) {
    return {
      url: null,
      path: null,
      error: {
        message: error.message || "Failed to upload student ID",
      },
    };
  }
};

/**
 * Delete file from Supabase storage
 * @param {string} filePath - File path in storage
 * @param {string} bucketType - 'resume' or 'student_id'
 * @returns {Promise<{success: boolean, error: object | null}>}
 */
export const deleteFile = async (filePath, bucketType = "resume") => {
  try {
    const bucketName =
      bucketType === "resume"
        ? UPLOAD_CONFIG.RESUME_BUCKET
        : UPLOAD_CONFIG.STUDENT_ID_BUCKET;

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: { message: error.message || "Failed to delete file" },
    };
  }
};

/**
 * Extract text from resume file (for sending to DeepSeek)
 * Supports PDF, DOCX, TXT
 * @param {File} file - Resume file
 * @returns {Promise<{text: string, error: object | null}>}
 */
export const extractResumeFile = async (file) => {
  try {
    if (file.type === "text/plain") {
      // Read text file directly
      const text = await file.text();
      return { text, error: null };
    }

    if (
      file.type === "application/pdf" ||
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // For PDF and Word documents, we need external libraries
      // For MVP, we'll upload and extract server-side or use OCR
      // Returning base64 encoded file for server-side processing

      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );

      return {
        text: base64,
        error: {
          message:
            "PDF/Word extraction requires server-side processing. Sending for processing...",
        },
      };
    }

    return {
      text: null,
      error: { message: "Unsupported file type for text extraction" },
    };
  } catch (error) {
    return {
      text: null,
      error: {
        message: error.message || "Failed to extract resume text",
      },
    };
  }
};

/**
 * Create buckets if they don't exist (run once during setup)
 * @returns {Promise<{success: boolean, error: object | null}>}
 */
export const createStorageBuckets = async () => {
  try {
    // Create resume bucket
    const resumeBucketExists = await supabase.storage
      .getBucket(UPLOAD_CONFIG.RESUME_BUCKET)
      .catch(() => null);

    if (!resumeBucketExists) {
      await supabase.storage.createBucket(UPLOAD_CONFIG.RESUME_BUCKET, {
        public: true,
      });
    }

    // Create student ID bucket
    const idBucketExists = await supabase.storage
      .getBucket(UPLOAD_CONFIG.STUDENT_ID_BUCKET)
      .catch(() => null);

    if (!idBucketExists) {
      await supabase.storage.createBucket(UPLOAD_CONFIG.STUDENT_ID_BUCKET, {
        public: true,
      });
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: { message: error.message || "Failed to create storage buckets" },
    };
  }
};
