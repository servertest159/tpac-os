ALTER TABLE public.gear ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_gear_archived_at ON public.gear(archived_at);