
-- Add status column to events table to track programme state
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'aborted', 'completed'));

-- Create index for better performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- Update existing events to have 'active' status
UPDATE public.events SET status = 'active' WHERE status IS NULL;
