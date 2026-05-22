
-- Remove all existing event role requirements
DELETE FROM public.event_role_requirements;

-- Insert new requirements: 1 for each of 15 roles (excluding 'Member'), for each event
INSERT INTO public.event_role_requirements (event_id, role, quantity)
SELECT
  e.id AS event_id,
  r.role::app_role,  -- cast to enum
  1 AS quantity
FROM public.events e
CROSS JOIN (
  VALUES 
    ('President'),
    ('Vice-President'),
    ('Honorary Secretary'),
    ('Honorary Assistant Secretary'),
    ('Honorary Treasurer'),
    ('Honorary Assistant Treasurer'),
    ('Training Head (General)'),
    ('Training Head (Land)'),
    ('Training Head (Water)'),
    ('Training Head (Welfare)'),
    ('Quartermaster'),
    ('Assistant Quarter Master'),
    ('Publicity Head'),
    ('First Assistant Publicity Head'),
    ('Second Assistant Publicity Head')
) AS r(role);

