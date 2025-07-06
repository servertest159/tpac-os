
-- Add creator_id column to events table if it doesn't exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS policies for events table
DROP POLICY IF EXISTS "Public can insert events" ON public.events;
DROP POLICY IF EXISTS "Public can update events" ON public.events;
DROP POLICY IF EXISTS "Public can delete events" ON public.events;

-- Create proper RLS policies
CREATE POLICY "Authenticated users can create events" ON public.events 
  FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Event creators can update their events" ON public.events 
  FOR UPDATE 
  USING (auth.uid() = creator_id);

CREATE POLICY "Event creators can delete their events" ON public.events 
  FOR DELETE 
  USING (auth.uid() = creator_id);

-- Update RLS policies for event_role_requirements
DROP POLICY IF EXISTS "Public can view event role requirements" ON public.event_role_requirements;

CREATE POLICY "Public can view event role requirements" ON public.event_role_requirements 
  FOR SELECT 
  USING (true);

CREATE POLICY "Event creators can manage role requirements" ON public.event_role_requirements 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE public.events.id = event_id 
      AND public.events.creator_id = auth.uid()
    )
  );
