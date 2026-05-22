-- Maintainer/developer invite code (matches client Gate + auth helpers).
INSERT INTO public.access_codes (code, role, holder_name, notes, active)
VALUES (
  '111111',
  'Developer',
  'Platform developer',
  'Maintainer bypass; restricted System Notes sections in-app.',
  true
)
ON CONFLICT (code)
DO UPDATE SET
  role = EXCLUDED.role,
  holder_name = EXCLUDED.holder_name,
  notes = EXCLUDED.notes,
  active = true;
