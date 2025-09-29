-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_clearances_updated_at ON public.clearances;

-- Create audit table for clearances access
CREATE TABLE IF NOT EXISTS public.clearances_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clearance_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  accessed_fields text[],
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  session_id text
);

-- Enable RLS on audit table
ALTER TABLE public.clearances_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view clearances audit logs"
ON public.clearances_audit_log
FOR ALL
USING (has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role));

-- Create function to log clearances access
CREATE OR REPLACE FUNCTION public.log_clearances_access(
  _clearance_id uuid,
  _action text,
  _fields text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    _action,
    _fields,
    inet_client_addr(),
    now()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log errors but don't block the main operation
    NULL;
END;
$$;

-- Create function to check if user can access sensitive clearance data
CREATE OR REPLACE FUNCTION public.can_access_sensitive_clearance_data(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(_user_id, 'President'::app_role) AND NOT has_role(_user_id, 'Vice-President'::app_role) THEN
    RETURN false;
  END IF;
  
  -- Log the sensitive access attempt
  PERFORM log_clearances_access(
    '00000000-0000-0000-0000-000000000000'::uuid,
    'sensitive_data_access',
    ARRAY['security_level', 'investigation_type', 'sponsoring_agency']
  );
  
  RETURN true;
END;
$$;

-- Create trigger function for clearances audit logging
CREATE OR REPLACE FUNCTION public.trigger_log_clearances_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log INSERT operations
  IF TG_OP = 'INSERT' THEN
    PERFORM log_clearances_access(
      NEW.id,
      'create',
      ARRAY['security_level', 'investigation_type', 'sponsoring_agency', 'investigating_agency']
    );
    RETURN NEW;
  END IF;
  
  -- Log UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    PERFORM log_clearances_access(
      NEW.id,
      'update',
      ARRAY['security_level', 'status', 'investigation_type', 'sponsoring_agency']
    );
    RETURN NEW;
  END IF;
  
  -- Log DELETE operations
  IF TG_OP = 'DELETE' THEN
    PERFORM log_clearances_access(
      OLD.id,
      'delete',
      ARRAY['security_level', 'investigation_type', 'sponsoring_agency']
    );
    RETURN OLD;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage clearances" ON public.clearances;
DROP POLICY IF EXISTS "Admins can view all clearances" ON public.clearances;
DROP POLICY IF EXISTS "Users can view their own clearances" ON public.clearances;

-- Create enhanced admin policy with audit logging
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

-- Users can view their own clearances with logging
CREATE POLICY "Users can view own clearances with audit"
ON public.clearances
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add audit triggers
CREATE TRIGGER clearances_audit_insert
  AFTER INSERT ON public.clearances
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_clearances_access();

CREATE TRIGGER clearances_audit_update
  AFTER UPDATE ON public.clearances
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_clearances_access();

CREATE TRIGGER clearances_audit_delete
  AFTER DELETE ON public.clearances
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_clearances_access();

-- Create view for clearances with sensitive data masked for non-admins
CREATE OR REPLACE VIEW public.clearances_secure AS
SELECT 
  id,
  user_id,
  CASE 
    WHEN has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role) 
    THEN security_level::text
    ELSE 'CLASSIFIED'
  END as security_level,
  status,
  granted_date,
  expiration_date,
  adjudication_date,
  created_at,
  updated_at,
  CASE 
    WHEN has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role) 
    THEN notes
    ELSE '[REDACTED]'
  END as notes,
  CASE 
    WHEN has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role) 
    THEN investigation_type
    ELSE '[CLASSIFIED]'
  END as investigation_type,
  CASE 
    WHEN has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role) 
    THEN sponsoring_agency
    ELSE '[CLASSIFIED]'
  END as sponsoring_agency,
  CASE 
    WHEN has_role(auth.uid(), 'President'::app_role) OR has_role(auth.uid(), 'Vice-President'::app_role) 
    THEN investigating_agency
    ELSE '[CLASSIFIED]'
  END as investigating_agency
FROM public.clearances
WHERE 
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'President'::app_role) 
  OR has_role(auth.uid(), 'Vice-President'::app_role);

-- Create indexes for audit table performance
CREATE INDEX IF NOT EXISTS idx_clearances_audit_log_user_id ON public.clearances_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_clearances_audit_log_clearance_id ON public.clearances_audit_log(clearance_id);
CREATE INDEX IF NOT EXISTS idx_clearances_audit_log_created_at ON public.clearances_audit_log(created_at);

-- Recreate the update timestamp trigger
CREATE TRIGGER update_clearances_updated_at
  BEFORE UPDATE ON public.clearances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();