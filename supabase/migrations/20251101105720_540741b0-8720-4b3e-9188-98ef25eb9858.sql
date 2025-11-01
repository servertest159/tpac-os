-- Fix gear table RLS policies to allow authenticated users to view gear
DROP POLICY IF EXISTS "Authenticated users can view all gear" ON public.gear;
DROP POLICY IF EXISTS "Admins can add gear" ON public.gear;
DROP POLICY IF EXISTS "Admins can update gear" ON public.gear;
DROP POLICY IF EXISTS "Admins can delete gear" ON public.gear;

-- Allow all authenticated users to view gear
CREATE POLICY "Authenticated users can view all gear"
ON public.gear
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage gear
CREATE POLICY "Admins can add gear"
ON public.gear
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role));

CREATE POLICY "Admins can update gear"
ON public.gear
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role))
WITH CHECK (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role));

CREATE POLICY "Admins can delete gear"
ON public.gear
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role));