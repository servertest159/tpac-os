-- Update RLS policy for gear table to allow public read access
-- This is safe because the app already has access gate protection

DROP POLICY IF EXISTS "Authenticated users can view all gear" ON gear;

CREATE POLICY "Public can view all gear"
ON gear
FOR SELECT
TO public
USING (true);

-- Keep admin-only policies for modifications
-- (Admins can add gear, Admins can update gear, Admins can delete gear remain unchanged)