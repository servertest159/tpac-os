-- Secure RLS for emergency_contacts: restrict to event creators/admins and invited users

-- Ensure RLS is enabled
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Drop insecure public policies
DROP POLICY IF EXISTS "Public can delete emergency contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Public can insert emergency contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Public can update emergency contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Public can view emergency contacts" ON public.emergency_contacts;

-- Event creators and admins can manage (insert/update/delete/select)
CREATE POLICY "Event creators and admins can manage emergency contacts"
ON public.emergency_contacts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = emergency_contacts.trip_id
      AND events.creator_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'President'::public.app_role)
    OR public.has_role(auth.uid(), 'Vice-President'::public.app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = emergency_contacts.trip_id
      AND events.creator_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'President'::public.app_role)
    OR public.has_role(auth.uid(), 'Vice-President'::public.app_role)
);

-- Invited users can view contacts for their events
CREATE POLICY "Invited users can view emergency contacts"
ON public.emergency_contacts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_invitations ei
    WHERE ei.event_id = emergency_contacts.trip_id
      AND ei.user_id = auth.uid()
  )
);
