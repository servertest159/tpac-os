
-- Drop dependent objects to allow for enum modification. Use IF EXISTS to avoid errors.
DROP POLICY IF EXISTS "Admins can manage roles." ON public.user_roles;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- In case a previous run failed, drop the temporary enum name.
DROP TYPE IF EXISTS old_app_role;

-- Rename the existing app_role enum to a temporary name.
ALTER TYPE public.app_role RENAME TO old_app_role;

-- Create the new app_role enum with the complete list of roles.
CREATE TYPE public.app_role AS ENUM (
  'President',
  'Vice-President',
  'Honorary Secretary',
  'Honorary Assistant Secretary',
  'Honorary Treasurer',
  'Honorary Assistant Treasurer',
  'Training Head (General)',
  'Training Head (Land)',
  'Training Head (Water)',
  'Training Head (Welfare)',
  'Quartermaster',
  'Assistant Quarter Master',
  'Publicity Head',
  'Assistant Publicity Head',
  'Member'
);

-- Alter the column to use the new enum type.
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role
  USING role::text::public.app_role;

-- The conversion was successful, so we can drop the old enum type.
DROP TYPE old_app_role;

-- Recreate the has_role function. This is still useful for any server-side logic
-- that might need to check roles.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- Re-create the policy for admins to manage roles.
CREATE POLICY "Admins can manage roles."
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'President') OR public.has_role(auth.uid(), 'Vice-President'))
  WITH CHECK (public.has_role(auth.uid(), 'President') OR public.has_role(auth.uid(), 'Vice-President'));

-- Re-affirm that the public can view roles.
DROP POLICY IF EXISTS "Public can view roles" ON public.user_roles;
CREATE POLICY "Public can view roles" ON public.user_roles FOR SELECT USING (true);
