-- ============================================================================
-- Create chat-attachments storage bucket for chat images and files
-- Run this SQL in the Supabase SQL editor to create the bucket
-- ============================================================================

-- Insert the bucket into storage.buckets
-- This creates a public bucket for chat file attachments
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  false,
  15728640, -- 15MB in bytes
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files (needed for viewing images/files)
CREATE POLICY "Public Access to chat attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-attachments');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own chat attachments"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-attachments'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: The upload path format is:
--   images/{conversation_id}/{uuid}.{ext}
--   files/{conversation_id}/{uuid}_{filename}.{ext}
-- So folder-based ownership checks won't match the user's own ID.
-- For simplicity with the current path structure, we allow all authenticated
-- users to upload, and rely on the application layer for authorization.
DROP POLICY IF EXISTS "Users can update their own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;

-- Simpler policies: any authenticated user can manage chat attachments
CREATE POLICY "Authenticated users can update chat attachments"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete chat attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');