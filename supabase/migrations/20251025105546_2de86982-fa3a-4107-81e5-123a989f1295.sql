-- ============================================
-- SECURITY ENHANCEMENT MIGRATION
-- 1. Storage bucket policies with private access
-- 2. Audit logging for relief_contacts
-- 3. Storage RLS policies
-- ============================================

-- ============================================
-- PART 1: Make storage buckets private
-- ============================================

-- Update media bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'media';

-- Update gear-uploads bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'gear-uploads';

-- ============================================
-- PART 2: Create storage RLS policies
-- ============================================

-- Drop existing permissive policies if any
DROP POLICY IF EXISTS "Public access to gear uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public access to media" ON storage.objects;

-- Gear uploads: Only admins can upload, update, delete
CREATE POLICY "Admins can upload gear photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gear-uploads' AND
  (has_role(auth.uid(), 'President'::app_role) OR 
   has_role(auth.uid(), 'Vice-President'::app_role))
);

CREATE POLICY "Admins can update gear photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gear-uploads' AND
  (has_role(auth.uid(), 'President'::app_role) OR 
   has_role(auth.uid(), 'Vice-President'::app_role))
);

CREATE POLICY "Admins can delete gear photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'gear-uploads' AND
  (has_role(auth.uid(), 'President'::app_role) OR 
   has_role(auth.uid(), 'Vice-President'::app_role))
);

-- Authenticated users can view gear photos (read-only)
CREATE POLICY "Authenticated users can view gear photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'gear-uploads');

-- Media bucket: Users own their media
CREATE POLICY "Users can upload their own media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- PART 3: Audit logging for relief_contacts
-- ============================================

-- Create audit log table for relief_contacts
CREATE TABLE IF NOT EXISTS public.relief_contacts_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  accessed_by uuid NOT NULL,
  action text NOT NULL,
  accessed_fields text[],
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.relief_contacts_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view relief contacts audit logs"
ON public.relief_contacts_audit_log
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'President'::app_role) OR 
  has_role(auth.uid(), 'Vice-President'::app_role)
);

-- Create logging function
CREATE OR REPLACE FUNCTION public.log_relief_contacts_access(
  _contact_id uuid,
  _action text,
  _fields text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only log admin access (not users viewing their own data)
  IF EXISTS (
    SELECT 1 FROM public.relief_contacts 
    WHERE id = _contact_id AND user_id != auth.uid()
  ) THEN
    INSERT INTO public.relief_contacts_audit_log (
      contact_id,
      accessed_by,
      action,
      accessed_fields,
      ip_address,
      created_at
    ) VALUES (
      _contact_id,
      auth.uid(),
      _action,
      _fields,
      inet_client_addr(),
      now()
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log errors but don't block operations
    RAISE WARNING 'Failed to log relief contact access: %', SQLERRM;
END;
$$;

-- Create trigger for audit logging
CREATE OR REPLACE FUNCTION public.trigger_log_relief_contacts_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log admin SELECT operations
  IF TG_OP = 'SELECT' AND auth.uid() != NEW.user_id THEN
    PERFORM log_relief_contacts_access(
      NEW.id,
      'admin_view',
      ARRAY['name', 'phone', 'type']
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to check for bulk admin access (monitoring)
CREATE OR REPLACE FUNCTION public.check_bulk_relief_contacts_access()
RETURNS TABLE(
  accessed_by uuid,
  access_count bigint,
  first_access timestamptz,
  last_access timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    accessed_by,
    COUNT(DISTINCT contact_id) as access_count,
    MIN(created_at) as first_access,
    MAX(created_at) as last_access
  FROM relief_contacts_audit_log
  WHERE created_at > now() - interval '24 hours'
  GROUP BY accessed_by
  HAVING COUNT(DISTINCT contact_id) > 10
  ORDER BY access_count DESC;
$$;