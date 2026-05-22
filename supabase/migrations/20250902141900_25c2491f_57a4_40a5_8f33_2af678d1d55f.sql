-- Restrict read access on relief_contacts to owners and admins only

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.relief_contacts ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all relief contacts" ON public.relief_contacts;

-- Allow owners to view their own contacts
CREATE POLICY "Users can view their own relief contacts"
ON public.relief_contacts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins (President/Vice-President) to view all contacts
CREATE POLICY "Admins can view all relief contacts"
ON public.relief_contacts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'President'::public.app_role)
  OR public.has_role(auth.uid(), 'Vice-President'::public.app_role)
);
