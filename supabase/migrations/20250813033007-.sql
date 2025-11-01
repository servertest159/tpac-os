-- Enable RLS on the public.User table and add safe minimal policies

-- 1) Enable Row Level Security
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- 2) Least-privilege policies to avoid breaking the app
--    a) Allow a user to read only their own record (if ever used)
CREATE POLICY "Users can view their own user record"
ON public."User"
FOR SELECT
USING (id = auth.uid());

--    b) Allow admins to fully manage records
CREATE POLICY "Admins can manage users"
ON public."User"
FOR ALL
USING (
  has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role)
);
