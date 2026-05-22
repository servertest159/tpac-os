-- Secure RLS for habits: remove public access and enforce user-scoped policies

-- Ensure RLS is enabled
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Drop insecure public policy
DROP POLICY IF EXISTS "Public access for habits" ON public.habits;

-- Replace any prior generic user policy with explicit, correct policies
DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;

-- Users can view their own habits
CREATE POLICY "Users can view their own habits"
ON public.habits
FOR SELECT
USING (user_id = auth.uid()::text);

-- Users can insert their own habits
CREATE POLICY "Users can insert their own habits"
ON public.habits
FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own habits
CREATE POLICY "Users can update their own habits"
ON public.habits
FOR UPDATE
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Users can delete their own habits
CREATE POLICY "Users can delete their own habits"
ON public.habits
FOR DELETE
USING (user_id = auth.uid()::text);