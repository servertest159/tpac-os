
-- Create a new ENUM type for invitation status
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined');

-- Create a table to store event invitations
CREATE TABLE public.event_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A user can only be invited to an event once
  UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_invitations
-- Policy: Event creators can do anything with invitations for their events.
CREATE POLICY "Event creators can manage invitations"
ON public.event_invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE public.events.id = event_invitations.event_id AND public.events.creator_id = auth.uid()
  )
);

-- Policy: Invited users can see their own invitations.
CREATE POLICY "Invited users can view their own invitations"
ON public.event_invitations
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Invited users can update their own invitation status (e.g. accept/decline).
CREATE POLICY "Invited users can update their own invitation status"
ON public.event_invitations
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
