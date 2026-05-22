-- Update RLS policy to allow access-code-based event creation
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;

-- Create new policy that allows both authenticated users and service role (for access code flow)
CREATE POLICY "Users can create events"
ON public.events
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  -- Either authenticated user creating their own event
  (auth.uid() = creator_id)
  OR
  -- Or service role creating event via edge function (access code flow)
  (auth.role() = 'service_role' AND creator_id IS NULL)
);

-- Also update the select policy to allow viewing events created via access code
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;

CREATE POLICY "Users can view events"
ON public.events
FOR SELECT
TO authenticated, anon
USING (true);

-- Update policies to allow updates/deletes for access-code-created events
DROP POLICY IF EXISTS "Event creators can update their events" ON public.events;

CREATE POLICY "Event creators can update events"
ON public.events
FOR UPDATE
TO authenticated, service_role
USING (
  (auth.uid() = creator_id)
  OR
  (auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Event creators can delete their events" ON public.events;

CREATE POLICY "Event creators can delete events"
ON public.events
FOR DELETE
TO authenticated, service_role
USING (
  (auth.uid() = creator_id)
  OR
  (auth.role() = 'service_role')
);