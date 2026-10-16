-- Migration: 20261014000001_storage.sql
-- Description: Private storage bucket for study materials and user-isolated policies

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study-materials',
  'study-materials',
  false,
  104857600, -- 100MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['application/pdf'];

-- RLS for storage.objects: user isolated by path prefix (first folder = auth.uid())
-- Path format: {user_id}/{exam_id}/{subject_slug}/{topic_slug}/{filename}

CREATE POLICY "storage_user_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'study-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "storage_user_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "storage_user_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'study-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'study-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "storage_user_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'study-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
