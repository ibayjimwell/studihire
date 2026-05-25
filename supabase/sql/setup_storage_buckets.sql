-- ═══════════════════════════════════════════════════════════════════════════════
-- Storage Buckets Setup
-- Run this in Supabase Dashboard SQL Editor or via psql
-- ═══════════════════════════════════════════════════════════════════════════════

-- Deliveries bucket (for student work files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deliveries',
  'deliveries',
  true,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-rar-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'video/mp4',
    'video/webm'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Credentials bucket (for student certificates)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'credentials',
  'credentials',
  true,
  20971520, -- 20MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg'
  ]
) ON CONFLICT (id) DO NOTHING;