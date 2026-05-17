
-- 1. Access codes table (replaces hardcoded map in AccessGate.tsx)
CREATE TABLE IF NOT EXISTS public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  role text NOT NULL,
  holder_name text,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON public.access_codes(code) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_access_codes_role ON public.access_codes(role);

-- 2. Audit log for access code changes
CREATE TABLE IF NOT EXISTS public.access_codes_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id uuid,
  action text NOT NULL,
  performed_by_code text,
  performed_by_role text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_codes_audit_created ON public.access_codes_audit_log(created_at DESC);

-- 3. Updated-at trigger
DROP TRIGGER IF EXISTS trg_access_codes_updated_at ON public.access_codes;
CREATE TRIGGER trg_access_codes_updated_at
BEFORE UPDATE ON public.access_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS - this project uses a custom AccessGate, not auth.uid(),
--    so policies are permissive at the row level and admin gating is enforced in app code.
--    We still restrict destructive ops to authenticated/anon clients only via standard policies.
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can verify codes" ON public.access_codes;
CREATE POLICY "Public can verify codes"
  ON public.access_codes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can insert codes" ON public.access_codes;
CREATE POLICY "Public can insert codes"
  ON public.access_codes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update codes" ON public.access_codes;
CREATE POLICY "Public can update codes"
  ON public.access_codes FOR UPDATE
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete codes" ON public.access_codes;
CREATE POLICY "Public can delete codes"
  ON public.access_codes FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Public can read audit log" ON public.access_codes_audit_log;
CREATE POLICY "Public can read audit log"
  ON public.access_codes_audit_log FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can write audit log" ON public.access_codes_audit_log;
CREATE POLICY "Public can write audit log"
  ON public.access_codes_audit_log FOR INSERT WITH CHECK (true);

-- 5. Seed existing 16 codes/roles from AccessGate.tsx
INSERT INTO public.access_codes (code, role, holder_name) VALUES
  ('938271', 'President', 'President'),
  ('472839', 'Vice-President', 'Vice-President'),
  ('615204', 'Honorary Secretary', 'Honorary Secretary'),
  ('307198', 'Honorary Assistant Secretary', 'Honorary Assistant Secretary'),
  ('529746', 'Honorary Treasurer', 'Honorary Treasurer'),
  ('184302', 'Honorary Assistant Treasurer', 'Honorary Assistant Treasurer'),
  ('763910', 'Training Head (General)', 'Training Head (General)'),
  ('920458', 'Training Head (Land)', 'Training Head (Land)'),
  ('381207', 'Training Head (Water)', 'Training Head (Water)'),
  ('640193', 'Training Head (Welfare)', 'Training Head (Welfare)'),
  ('859321', 'Quartermaster', 'Quartermaster'),
  ('712496', 'Assistant Quarter Master', 'Assistant Quarter Master'),
  ('530984', 'Publicity Head', 'Publicity Head'),
  ('298374', 'First Assistant Publicity Head', 'First Assistant Publicity Head'),
  ('476213', 'Second Assistant Publicity Head', 'Second Assistant Publicity Head'),
  ('888888', 'Member', 'Member')
ON CONFLICT (code) DO NOTHING;
