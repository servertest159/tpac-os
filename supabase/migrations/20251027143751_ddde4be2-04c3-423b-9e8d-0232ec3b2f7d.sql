-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view gear" ON public.gear;
DROP POLICY IF EXISTS "Only admins can add gear" ON public.gear;
DROP POLICY IF EXISTS "Only admins can update gear" ON public.gear;
DROP POLICY IF EXISTS "Only admins can delete gear" ON public.gear;

-- Create new policies that allow authenticated users to view gear
CREATE POLICY "Authenticated users can view all gear"
ON public.gear
FOR SELECT
TO authenticated
USING (true);

-- Admins can insert gear
CREATE POLICY "Admins can add gear"
ON public.gear
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'President'::app_role) OR 
  has_role(auth.uid(), 'Vice-President'::app_role)
);

-- Admins can update gear
CREATE POLICY "Admins can update gear"
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

-- Admins can delete gear
CREATE POLICY "Admins can delete gear"
ON public.gear
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'President'::app_role) OR 
  has_role(auth.uid(), 'Vice-President'::app_role)
);