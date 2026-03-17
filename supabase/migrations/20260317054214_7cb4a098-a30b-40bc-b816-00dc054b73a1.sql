-- Drop restrictive write policies that require Supabase auth (which this app doesn't use)
DROP POLICY IF EXISTS "Admins can add gear" ON public.gear;
DROP POLICY IF EXISTS "Admins can update gear" ON public.gear;
DROP POLICY IF EXISTS "Admins can delete gear" ON public.gear;

-- Allow all users to insert, update, delete gear
-- The app uses access code authentication (not Supabase auth), so RLS must allow public access
CREATE POLICY "Allow public insert gear" ON public.gear FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update gear" ON public.gear FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete gear" ON public.gear FOR DELETE TO public USING (true);