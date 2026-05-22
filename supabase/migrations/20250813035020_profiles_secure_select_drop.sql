-- Secure the public.profiles table by removing public read access
-- and restricting SELECT to the record owner or admins

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove permissive or outdated policies (idempotent)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;

-- Only the profile owner can read their profile
CREATE POLICY "Users can view their own profile."
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles."
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role)
);

-- Keep existing INSERT/UPDATE self policies as defined elsewhere.
