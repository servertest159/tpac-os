-- Fix User table RLS policies to prevent email harvesting
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own user record" ON public."User";
DROP POLICY IF EXISTS "Admins can manage users" ON public."User";

-- Create new policies that restrict to authenticated users only
CREATE POLICY "Authenticated users can view their own user record"
ON public."User"
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can manage all users"
ON public."User"
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'President'::app_role) OR 
  has_role(auth.uid(), 'Vice-President'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'President'::app_role) OR 
  has_role(auth.uid(), 'Vice-President'::app_role)
);