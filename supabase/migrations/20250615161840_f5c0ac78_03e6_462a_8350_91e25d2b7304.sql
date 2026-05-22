
-- Add creator_id to events table if it doesn't exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create event_role_requirements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_role_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, role)
);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on events table to avoid conflicts
DROP POLICY IF EXISTS "Public can view events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Creators can update their own events" ON public.events;
DROP POLICY IF EXISTS "Creators can delete their own events" ON public.events;

-- RLS Policies for the 'events' table
CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their own events" ON public.events FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete their own events" ON public.events FOR DELETE USING (auth.uid() = creator_id);

-- Enable RLS on event_role_requirements table
ALTER TABLE public.event_role_requirements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on event_role_requirements table to be safe
DROP POLICY IF EXISTS "Public can view event role requirements" ON public.event_role_requirements;
DROP POLICY IF EXISTS "Creators can manage role requirements for their events" ON public.event_role_requirements;

-- RLS Policies for the 'event_role_requirements' table
CREATE POLICY "Public can view event role requirements" ON public.event_role_requirements FOR SELECT USING (true);
CREATE POLICY "Creators can manage role requirements for their events" ON public.event_role_requirements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE public.events.id = event_id AND public.events.creator_id = auth.uid()
  )
);
