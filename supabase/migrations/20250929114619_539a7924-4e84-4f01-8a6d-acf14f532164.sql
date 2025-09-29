-- Fix security definer view issue by removing it and using the table directly
DROP VIEW IF EXISTS public.clearances_secure;

-- Fix the clearances policies to be more restrictive (authenticated only)
DROP POLICY IF EXISTS "Enhanced admin clearances management" ON public.clearances;
DROP POLICY IF EXISTS "Users can view own clearances with audit" ON public.clearances;
DROP POLICY IF EXISTS "Only admins can view clearances audit logs" ON public.clearances_audit_log;

-- Create more secure policies for clearances
CREATE POLICY "Enhanced admin clearances management"
ON public.clearances
FOR ALL
TO authenticated
USING (
  (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role))
  AND can_access_sensitive_clearance_data(auth.uid())
)
WITH CHECK (
  (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role))
  AND can_access_sensitive_clearance_data(auth.uid())
);

-- Users can view their own clearances with logging - authenticated only
CREATE POLICY "Users can view own clearances with audit"
ON public.clearances
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Audit log access restricted to authenticated admins only
CREATE POLICY "Only admins can view clearances audit logs"
ON public.clearances_audit_log
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role))
WITH CHECK (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role));

-- Fix function search paths to be secure
DROP FUNCTION IF EXISTS public.get_upcoming_trips_with_stats();
CREATE OR REPLACE FUNCTION public.get_upcoming_trips_with_stats()
RETURNS TABLE(id uuid, title text, date timestamp with time zone, end_date timestamp with time zone, location text, gear_total bigint, gear_packed bigint, participant_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.date,
    e.end_date,
    e.location,
    COUNT(DISTINCT tgi.id) AS gear_total,
    COUNT(DISTINCT tgi.id) FILTER (WHERE tgi.status = 'Packed') AS gear_packed,
    COUNT(DISTINCT tp.id) AS participant_count
  FROM
    public.events e
  LEFT JOIN
    public.trip_gear_items tgi ON e.id = tgi.trip_id
  LEFT JOIN
    public.trip_participants tp ON e.id = tp.trip_id
  WHERE
    e.end_date >= now()
  GROUP BY
    e.id
  ORDER BY
    e.date ASC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_past_trips_with_stats();
CREATE OR REPLACE FUNCTION public.get_past_trips_with_stats()
RETURNS TABLE(id uuid, title text, date timestamp with time zone, end_date timestamp with time zone, location text, gear_total bigint, gear_packed bigint, participant_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.date,
    e.end_date,
    e.location,
    COUNT(DISTINCT tgi.id) AS gear_total,
    COUNT(DISTINCT tgi.id) FILTER (WHERE tgi.status = 'Packed') AS gear_packed,
    COUNT(DISTINCT tp.id) AS participant_count
  FROM
    public.events e
  LEFT JOIN
    public.trip_gear_items tgi ON e.id = tgi.trip_id
  LEFT JOIN
    public.trip_participants tp ON e.id = tp.trip_id
  WHERE
    e.end_date < now()
  GROUP BY
    e.id
  ORDER BY
    e.date DESC;
END;
$$;