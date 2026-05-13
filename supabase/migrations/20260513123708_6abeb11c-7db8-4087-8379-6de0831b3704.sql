ALTER TABLE public.events ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_events_archived_at ON public.events(archived_at);