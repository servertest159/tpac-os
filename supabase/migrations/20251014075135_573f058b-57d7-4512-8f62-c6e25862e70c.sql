-- Fix foreign key constraints for events table to allow proper deletion

-- Drop and recreate foreign keys with CASCADE delete for event_role_requirements
ALTER TABLE public.event_role_requirements
DROP CONSTRAINT IF EXISTS event_role_requirements_event_id_fkey;

ALTER TABLE public.event_role_requirements
ADD CONSTRAINT event_role_requirements_event_id_fkey 
FOREIGN KEY (event_id) 
REFERENCES public.events(id) 
ON DELETE CASCADE;

-- Drop and recreate foreign keys with CASCADE delete for event_invitations
ALTER TABLE public.event_invitations
DROP CONSTRAINT IF EXISTS event_invitations_event_id_fkey;

ALTER TABLE public.event_invitations
ADD CONSTRAINT event_invitations_event_id_fkey 
FOREIGN KEY (event_id) 
REFERENCES public.events(id) 
ON DELETE CASCADE;

-- Drop and recreate foreign keys with CASCADE delete for emergency_contacts
ALTER TABLE public.emergency_contacts
DROP CONSTRAINT IF EXISTS emergency_contacts_trip_id_fkey;

ALTER TABLE public.emergency_contacts
ADD CONSTRAINT emergency_contacts_trip_id_fkey 
FOREIGN KEY (trip_id) 
REFERENCES public.events(id) 
ON DELETE CASCADE;

-- Drop and recreate foreign keys with CASCADE delete for trip_gear_items
ALTER TABLE public.trip_gear_items
DROP CONSTRAINT IF EXISTS trip_gear_items_trip_id_fkey;

ALTER TABLE public.trip_gear_items
ADD CONSTRAINT trip_gear_items_trip_id_fkey 
FOREIGN KEY (trip_id) 
REFERENCES public.events(id) 
ON DELETE CASCADE;

-- Drop and recreate foreign keys with CASCADE delete for trip_participants
ALTER TABLE public.trip_participants
DROP CONSTRAINT IF EXISTS trip_participants_trip_id_fkey;

ALTER TABLE public.trip_participants
ADD CONSTRAINT trip_participants_trip_id_fkey 
FOREIGN KEY (trip_id) 
REFERENCES public.events(id) 
ON DELETE CASCADE;

-- Drop and recreate foreign keys with CASCADE delete for itinerary_items
ALTER TABLE public.itinerary_items
DROP CONSTRAINT IF EXISTS itinerary_items_trip_id_fkey;

ALTER TABLE public.itinerary_items
ADD CONSTRAINT itinerary_items_trip_id_fkey 
FOREIGN KEY (trip_id) 
REFERENCES public.events(id) 
ON DELETE CASCADE;

-- Drop and recreate foreign keys with CASCADE delete for trip_documents
ALTER TABLE public.trip_documents
DROP CONSTRAINT IF EXISTS trip_documents_trip_id_fkey;

ALTER TABLE public.trip_documents
ADD CONSTRAINT trip_documents_trip_id_fkey 
FOREIGN KEY (trip_id) 
REFERENCES public.events(id) 
ON DELETE CASCADE;

-- Drop and recreate foreign keys with CASCADE delete for gear_events
ALTER TABLE public.gear_events
DROP CONSTRAINT IF EXISTS gear_events_event_id_fkey;

ALTER TABLE public.gear_events
ADD CONSTRAINT gear_events_event_id_fkey 
FOREIGN KEY (event_id) 
REFERENCES public.events(id) 
ON DELETE CASCADE;