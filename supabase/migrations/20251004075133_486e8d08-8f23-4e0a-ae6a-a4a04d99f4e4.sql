-- Fix Security Definer View issue for clearances_secure_view
-- The view should not use SECURITY DEFINER to avoid privilege escalation

-- Drop the existing view
DROP VIEW IF EXISTS public.clearances_secure_view;

-- Recreate as a regular view without SECURITY DEFINER
-- Access control is enforced by RLS on the underlying clearances table
CREATE VIEW public.clearances_secure_view
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.user_id,
  c.security_level,
  c.status,
  c.granted_date,
  c.expiration_date,
  c.adjudication_date,
  c.created_at,
  c.updated_at,
  -- Sensitive fields are redacted for non-admin users
  CASE 
    WHEN (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role))
         AND can_access_sensitive_clearance_data(auth.uid()) 
    THEN c.investigating_agency
    ELSE '[REDACTED]'::text
  END as investigating_agency,
  CASE 
    WHEN (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role))
         AND can_access_sensitive_clearance_data(auth.uid())
    THEN c.sponsoring_agency
    ELSE '[REDACTED]'::text
  END as sponsoring_agency,
  CASE 
    WHEN (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role))
         AND can_access_sensitive_clearance_data(auth.uid())
    THEN c.investigation_type
    ELSE '[REDACTED]'::text
  END as investigation_type,
  CASE 
    WHEN (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role))
         AND can_access_sensitive_clearance_data(auth.uid())
    THEN c.notes
    ELSE '[REDACTED]'::text
  END as notes
FROM public.clearances c
WHERE 
  -- Users can see their own clearances (with redacted sensitive fields)
  c.user_id = auth.uid()
  OR
  -- Admins can see all clearances (full access)
  (
    (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role))
    AND can_access_sensitive_clearance_data(auth.uid())
  );

-- Revoke any existing grants and explicitly grant access
REVOKE ALL ON public.clearances_secure_view FROM PUBLIC;
GRANT SELECT ON public.clearances_secure_view TO authenticated;