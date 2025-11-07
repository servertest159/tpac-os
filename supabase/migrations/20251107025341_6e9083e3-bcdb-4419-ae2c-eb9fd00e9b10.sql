-- Update RLS policy to allow all authenticated users to delete events
DROP POLICY IF EXISTS "Event creators can delete events" ON public.events;

CREATE POLICY "All users can delete events"
ON public.events
FOR DELETE
TO authenticated, service_role
USING (
  -- Allow any authenticated user to delete any event
  (auth.uid() IS NOT NULL)
  OR
  -- Allow service role for edge function operations
  (auth.role() = 'service_role')
);