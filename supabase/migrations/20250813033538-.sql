-- Secure the public.profiles table by removing public read access
-- and restricting SELECT to the record owner or admins

-- Ensure RLS is enabled (idempotent if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1) Remove overly permissive public-read policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Public profiles are viewable by everyone.'
  ) THEN
    EXECUTE 'DROP POLICY "Public profiles are viewable by everyone." ON public.profiles';
  END IF;
END $$;

-- 2) Create least-privilege SELECT policies
-- a) Users can view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile.'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can view their own profile."
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
    $$;
  END IF;
END $$;

-- b) Admins can view all profiles (leverages existing has_role())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can view all profiles.'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Admins can view all profiles."
      ON public.profiles
      FOR SELECT
      USING (
        has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role)
      );
    $$;
  END IF;
END $$;

-- Keep existing INSERT/UPDATE self policies as defined; no changes made.
