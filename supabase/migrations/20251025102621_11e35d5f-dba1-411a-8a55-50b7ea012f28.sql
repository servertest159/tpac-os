-- ============================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- Addresses all error-level security findings
-- ============================================

-- 1. FIX USER TABLE POLICIES (user_table_missing_policies)
-- Allow users to self-register and update their own records

DROP POLICY IF EXISTS "Admins can manage all users" ON "User";
DROP POLICY IF EXISTS "Authenticated users can view their own user record" ON "User";

-- Users can insert their own record during signup
CREATE POLICY "Users can insert own user record" ON "User"
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Users can view their own record
CREATE POLICY "Users can view own user record" ON "User"
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own email
CREATE POLICY "Users can update own user record" ON "User"
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Only admins can delete users
CREATE POLICY "Admins can delete users" ON "User"
FOR DELETE 
USING (has_role(auth.uid(), 'President') OR has_role(auth.uid(), 'Vice-President'));

-- Admins can view all users for management
CREATE POLICY "Admins can view all users" ON "User"
FOR SELECT 
USING (has_role(auth.uid(), 'President') OR has_role(auth.uid(), 'Vice-President'));


-- 2. ADD PROFILES UPDATE POLICY (profiles_phone_exposure - partial fix)
-- Allow users to update their own profiles

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- 3. CREATE PROFILES AUDIT LOG (profiles_phone_exposure)
-- Track admin access to sensitive profile data

CREATE TABLE IF NOT EXISTS public.profiles_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  accessed_by uuid NOT NULL,
  accessed_fields text[],
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view profiles audit logs" ON profiles_audit_log
FOR SELECT 
USING (has_role(auth.uid(), 'President') OR has_role(auth.uid(), 'Vice-President'));


-- 4. RESTRICT PUBLIC DATA EXPOSURE (overly_permissive_public_policies)
-- Change all "public" policies to require authentication

-- Events: Require authentication to view
DROP POLICY IF EXISTS "Public can view events" ON events;
CREATE POLICY "Authenticated users can view events" ON events
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Gear: Require authentication to view
DROP POLICY IF EXISTS "Anyone can view gear" ON gear;
CREATE POLICY "Authenticated users can view gear" ON gear
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Trip participants: Require authentication
DROP POLICY IF EXISTS "Public can view participants" ON trip_participants;
CREATE POLICY "Authenticated users can view participants" ON trip_participants
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Trip documents: Require authentication
DROP POLICY IF EXISTS "Public can view documents" ON trip_documents;
CREATE POLICY "Authenticated users can view documents" ON trip_documents
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Trip gear items: Require authentication
DROP POLICY IF EXISTS "Public can view gear" ON trip_gear_items;
CREATE POLICY "Authenticated users can view gear items" ON trip_gear_items
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Itinerary items: Require authentication
DROP POLICY IF EXISTS "Public can view itinerary" ON itinerary_items;
CREATE POLICY "Authenticated users can view itinerary" ON itinerary_items
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Event role requirements: Require authentication
DROP POLICY IF EXISTS "Public can view event role requirements" ON event_role_requirements;
CREATE POLICY "Authenticated users can view role requirements" ON event_role_requirements
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Gear events: Require authentication
DROP POLICY IF EXISTS "Public can view gear_events" ON gear_events;
CREATE POLICY "Authenticated users can view gear_events" ON gear_events
FOR SELECT 
USING (auth.uid() IS NOT NULL);


-- 5. RESTRICT PUBLIC WRITE ACCESS (gear_events_fully_public from earlier finding)
-- Replace completely open policies with authenticated-only access

-- Gear events: Restrict to authenticated users
DROP POLICY IF EXISTS "Public can insert gear_events" ON gear_events;
DROP POLICY IF EXISTS "Public can update gear_events" ON gear_events;
DROP POLICY IF EXISTS "Public can delete gear_events" ON gear_events;

CREATE POLICY "Authenticated users can manage gear_events" ON gear_events
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Trip documents: Restrict to authenticated users
DROP POLICY IF EXISTS "Public can insert documents" ON trip_documents;
DROP POLICY IF EXISTS "Public can delete documents" ON trip_documents;

CREATE POLICY "Authenticated users can manage documents" ON trip_documents
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete documents" ON trip_documents
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Trip gear items: Restrict to authenticated users
DROP POLICY IF EXISTS "Public can insert gear" ON trip_gear_items;
DROP POLICY IF EXISTS "Public can update gear" ON trip_gear_items;
DROP POLICY IF EXISTS "Public can delete gear" ON trip_gear_items;

CREATE POLICY "Authenticated users can manage trip gear" ON trip_gear_items
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Itinerary items: Restrict to authenticated users
DROP POLICY IF EXISTS "Public can insert itinerary" ON itinerary_items;
DROP POLICY IF EXISTS "Public can update itinerary" ON itinerary_items;
DROP POLICY IF EXISTS "Public can delete itinerary" ON itinerary_items;

CREATE POLICY "Authenticated users can manage itinerary" ON itinerary_items
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Trip participants: Restrict to authenticated users
DROP POLICY IF EXISTS "Public can insert participants" ON trip_participants;
DROP POLICY IF EXISTS "Public can update participants" ON trip_participants;
DROP POLICY IF EXISTS "Public can delete participants" ON trip_participants;

CREATE POLICY "Authenticated users can manage participants" ON trip_participants
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);


-- 6. AUDIT LOGGING FUNCTIONS
-- Track sensitive data access for compliance

-- Function to log profile access by admins
CREATE OR REPLACE FUNCTION public.log_profile_access(
  _profile_id uuid,
  _accessed_fields text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if accessed by someone other than the profile owner
  IF auth.uid() != _profile_id THEN
    INSERT INTO profiles_audit_log (
      profile_id,
      accessed_by,
      accessed_fields,
      ip_address,
      created_at
    ) VALUES (
      _profile_id,
      auth.uid(),
      _accessed_fields,
      inet_client_addr(),
      now()
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log errors but don't block operations
    RAISE WARNING 'Failed to log profile access: %', SQLERRM;
END;
$$;

-- Function to check for bulk profile access (security monitoring)
CREATE OR REPLACE FUNCTION public.check_bulk_profile_access()
RETURNS TABLE(
  accessed_by uuid,
  access_count bigint,
  first_access timestamp with time zone,
  last_access timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    accessed_by,
    COUNT(DISTINCT profile_id) as access_count,
    MIN(created_at) as first_access,
    MAX(created_at) as last_access
  FROM profiles_audit_log
  WHERE created_at > now() - interval '24 hours'
  GROUP BY accessed_by
  HAVING COUNT(DISTINCT profile_id) > 10
  ORDER BY access_count DESC;
$$;