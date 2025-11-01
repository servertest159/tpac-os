import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export interface GearConflict {
  gearId: string;
  gearName: string;
  conflictingEventId: string;
  conflictingEventTitle: string;
  conflictingEventDate: string;
  quantityNeeded: number;
  quantityAvailable: number;
}

export const useGearConflicts = (eventId: string | undefined, eventDate?: Date, eventEndDate?: Date) => {
  const [conflicts, setConflicts] = useState<GearConflict[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConflicts = async () => {
      if (!eventId || !eventDate) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get gear allocated to this event
        const { data: currentEventGear, error: gearError } = await supabase
          .from('gear_events')
          .select('gear_id, quantity, gear(name, available)')
          .eq('event_id', eventId);

        if (gearError) throw gearError;
        if (!currentEventGear || currentEventGear.length === 0) {
          setConflicts([]);
          setLoading(false);
          return;
        }

        const endDate = eventEndDate || eventDate;

        // Find overlapping events (excluding current event)
        const { data: overlappingEvents, error: eventsError } = await supabase
          .from('events')
          .select('id, title, date, end_date')
          .neq('id', eventId)
          .or(`and(date.lte.${endDate.toISOString()},end_date.gte.${eventDate.toISOString()}),and(date.lte.${endDate.toISOString()},date.gte.${eventDate.toISOString()})`);

        if (eventsError) throw eventsError;
        if (!overlappingEvents || overlappingEvents.length === 0) {
          setConflicts([]);
          setLoading(false);
          return;
        }

        const overlappingEventIds = overlappingEvents.map(e => e.id);

        // Check if any of our gear is allocated to overlapping events
        const { data: conflictingAllocations, error: allocError } = await supabase
          .from('gear_events')
          .select('gear_id, quantity, event_id')
          .in('gear_id', currentEventGear.map(g => g.gear_id))
          .in('event_id', overlappingEventIds);

        if (allocError) throw allocError;

        // Build conflicts array
        const conflictsList: GearConflict[] = [];
        
        conflictingAllocations?.forEach(allocation => {
          const currentGear = currentEventGear.find(g => g.gear_id === allocation.gear_id);
          const conflictEvent = overlappingEvents.find(e => e.id === allocation.event_id);
          
          if (currentGear && conflictEvent && currentGear.gear) {
            const totalNeeded = (currentGear.quantity || 0) + (allocation.quantity || 0);
            const available = currentGear.gear.available || 0;

            if (totalNeeded > available) {
              conflictsList.push({
                gearId: allocation.gear_id,
                gearName: currentGear.gear.name,
                conflictingEventId: conflictEvent.id,
                conflictingEventTitle: conflictEvent.title,
                conflictingEventDate: new Date(conflictEvent.date).toLocaleDateString(),
                quantityNeeded: totalNeeded,
                quantityAvailable: available,
              });
            }
          }
        });

        setConflicts(conflictsList);
      } catch (err) {
        console.error('Error checking gear conflicts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConflicts();
  }, [eventId, eventDate, eventEndDate]);

  return { conflicts, loading };
};
