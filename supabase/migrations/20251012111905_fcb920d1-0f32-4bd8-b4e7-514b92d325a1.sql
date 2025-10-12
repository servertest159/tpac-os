-- Fix the RLS policy for gear table to properly allow viewing
DROP POLICY IF EXISTS "Authenticated users can view gear" ON gear;

-- Create a policy that allows anyone (authenticated or not) to view gear
-- This matches the original policy intent with Using Expression: true
CREATE POLICY "Anyone can view gear"
ON gear
FOR SELECT
TO public
USING (true);

-- Verify RLS is enabled
ALTER TABLE gear ENABLE ROW LEVEL SECURITY;