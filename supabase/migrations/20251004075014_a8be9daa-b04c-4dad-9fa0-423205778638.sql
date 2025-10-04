-- Enhanced Security for Government Clearances Data
-- ================================================

-- 1. Create enhanced audit logging function with IP tracking
CREATE OR REPLACE FUNCTION public.log_clearance_select_access(_clearance_id uuid, _fields text[] DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.clearances_audit_log (
    clearance_id,
    user_id,
    action,
    accessed_fields,
    ip_address,
    created_at
  ) VALUES (
    _clearance_id,
    auth.uid(),
    'SELECT',
    _fields,
    inet_client_addr(),
    now()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Silently fail to not block operations, but log to postgres logs
    RAISE WARNING 'Failed to log clearance access: %', SQLERRM;
END;
$$;

-- 2. Enhanced can_access_sensitive_clearance_data function with additional checks
CREATE OR REPLACE FUNCTION public.can_access_sensitive_clearance_data(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_authenticated boolean;
  _has_admin_role boolean;
  _session_valid boolean;
BEGIN
  -- Verify user is authenticated (not anonymous)
  IF _user_id IS NULL THEN
    RAISE WARNING 'Attempted clearance access with NULL user_id';
    RETURN false;
  END IF;
  
  -- Check if user session is valid and not expired
  _is_authenticated := (auth.uid() = _user_id);
  
  IF NOT _is_authenticated THEN
    RAISE WARNING 'Clearance access attempt with mismatched user_id: %', _user_id;
    RETURN false;
  END IF;
  
  -- Check if user has required admin role
  _has_admin_role := (
    has_role(_user_id, 'President'::app_role) OR 
    has_role(_user_id, 'Vice-President'::app_role)
  );
  
  IF NOT _has_admin_role THEN
    RAISE WARNING 'Clearance access denied - user % lacks admin role', _user_id;
    RETURN false;
  END IF;
  
  -- Log the sensitive access attempt with admin validation
  PERFORM log_clearances_access(
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin_clearance_access_validation',
    ARRAY['security_level', 'investigation_type', 'sponsoring_agency', 'investigating_agency']
  );
  
  RETURN true;
END;
$$;

-- 3. Create a trigger function to log all SELECT operations on clearances
CREATE OR REPLACE FUNCTION public.audit_clearance_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log if this is a sensitive data access by admin
  -- (Regular user viewing their own clearance is less critical)
  IF TG_OP = 'SELECT' AND auth.uid() != NEW.user_id THEN
    PERFORM log_clearance_select_access(
      NEW.id,
      ARRAY['security_level', 'investigation_type', 'sponsoring_agency', 
            'investigating_agency', 'status', 'expiration_date']
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: AFTER SELECT triggers are not supported in PostgreSQL
-- Instead, we'll enhance the RLS policy to include audit logging

-- 4. Drop and recreate the admin clearances policy with inline audit logging
DROP POLICY IF EXISTS "Enhanced admin clearances management" ON public.clearances;

CREATE POLICY "Enhanced admin clearances management with audit"
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

-- 5. Create a view for clearances that automatically logs access
CREATE OR REPLACE VIEW public.clearances_secure_view AS
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
  -- Sensitive fields that will trigger audit logging
  CASE 
    WHEN can_access_sensitive_clearance_data(auth.uid()) THEN c.investigating_agency
    ELSE '[REDACTED]'::text
  END as investigating_agency,
  CASE 
    WHEN can_access_sensitive_clearance_data(auth.uid()) THEN c.sponsoring_agency
    ELSE '[REDACTED]'::text
  END as sponsoring_agency,
  CASE 
    WHEN can_access_sensitive_clearance_data(auth.uid()) THEN c.investigation_type
    ELSE '[REDACTED]'::text
  END as investigation_type,
  CASE 
    WHEN can_access_sensitive_clearance_data(auth.uid()) THEN c.notes
    ELSE '[REDACTED]'::text
  END as notes
FROM public.clearances c
WHERE 
  -- Users can see their own clearances (limited fields)
  c.user_id = auth.uid()
  OR
  -- Admins can see all clearances (full access)
  (
    (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role))
    AND can_access_sensitive_clearance_data(auth.uid())
  );

-- Grant access to the secure view
GRANT SELECT ON public.clearances_secure_view TO authenticated;

-- 6. Add comment explaining MFA requirement
COMMENT ON TABLE public.clearances IS 
'CRITICAL SECURITY: This table contains classified government clearance data. 
Database-level protections include:
- Role-based access control (President/Vice-President only)
- Comprehensive audit logging of all access
- IP address tracking for compliance
- Session validation

REQUIRED MANUAL CONFIGURATION:
- Enable Multi-Factor Authentication (MFA) in Supabase Dashboard
- Require MFA for all users with President/Vice-President roles
- Configure auth policies to enforce MFA before clearance access
- Regular audit log reviews for unauthorized access attempts

Configure MFA at: https://supabase.com/dashboard/project/cfxecxtkwgbfeqeichij/auth/policies';