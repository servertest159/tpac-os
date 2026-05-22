-- Strengthen RLS on clearances: restrict policies to authenticated users only

-- Ensure RLS is enabled
ALTER TABLE public.clearances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with explicit role scoping
DROP POLICY IF EXISTS "Admins can manage clearances" ON public.clearances;
DROP POLICY IF EXISTS "Admins can view all clearances" ON public.clearances;
DROP POLICY IF EXISTS "Users can view their own clearances" ON public.clearances;

-- Admins (President/Vice-President) can manage all rows (insert/update/delete/select)
CREATE POLICY "Admins can manage clearances"
ON public.clearances
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'President'::public.app_role)
  OR public.has_role(auth.uid(), 'Vice-President'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'President'::public.app_role)
  OR public.has_role(auth.uid(), 'Vice-President'::public.app_role)
);

-- Admins can view all clearances (explicit select policy)
CREATE POLICY "Admins can view all clearances"
ON public.clearances
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'President'::public.app_role)
  OR public.has_role(auth.uid(), 'Vice-President'::public.app_role)
);

-- Users can only view their own clearances
CREATE POLICY "Users can view their own clearances"
ON public.clearances
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
