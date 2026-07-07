-- Add image_urls column to score_entries
ALTER TABLE score_entries
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

-- Create attachments storage bucket (reused for recipes later)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true,
  5242880, -- 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'attachments');

-- Anyone can view (public bucket, non-guessable paths)
CREATE POLICY "Anyone can view attachments"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'attachments');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'attachments' AND owner = auth.uid());
