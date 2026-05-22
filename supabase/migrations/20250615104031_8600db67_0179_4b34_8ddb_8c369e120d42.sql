
-- Add photo_url and uploaded_at columns to the gear table
ALTER TABLE public.gear
ADD COLUMN photo_url TEXT NULL,
ADD COLUMN uploaded_at TIMESTAMPTZ NULL;

-- Create a new storage bucket for gear photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('gear-uploads', 'gear-uploads', TRUE);

-- Add policies for the gear-uploads bucket to allow public access.
-- This allows anyone to view, upload, update, and delete images.
CREATE POLICY "Public Access for gear-uploads"
ON storage.objects FOR ALL
TO public
USING ( bucket_id = 'gear-uploads' )
WITH CHECK ( bucket_id = 'gear-uploads' );
