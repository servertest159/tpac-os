-- Fix gear table RLS policies to prevent unauthorized modifications
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public can delete gear" ON public.gear;
DROP POLICY IF EXISTS "Public can insert gear" ON public.gear;
DROP POLICY IF EXISTS "Public can update gear" ON public.gear;
DROP POLICY IF EXISTS "Public can view gear" ON public.gear;

-- Create new restrictive policies

-- Allow all authenticated users to view gear (needed for loadout checking)
CREATE POLICY "Authenticated users can view gear"
ON public.gear
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert gear
CREATE POLICY "Only admins can add gear"
ON public.gear
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'President'::app_role) OR 
  has_role(auth.uid(), 'Vice-President'::app_role)
);

-- Only admins can update gear
CREATE POLICY "Only admins can update gear"
ON public.gear
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'President'::app_role) OR 
  has_role(auth.uid(), 'Vice-President'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'President'::app_role) OR 
  has_role(auth.uid(), 'Vice-President'::app_role)
);

-- Only admins can delete gear
CREATE POLICY "Only admins can delete gear"
ON public.gear
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'President'::app_role) OR 
  has_role(auth.uid(), 'Vice-President'::app_role)
);