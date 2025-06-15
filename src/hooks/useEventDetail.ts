
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, Enums } from '@/integrations/supabase/types';

export type EventDetailType = Tables<'events'> & {
  event_role_requirements: Tables<'event_role_requirements'>[];
  event_invitations: ({
    status: Enums<'invitation_status'>;
    profiles: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email' | 'avatar_url'> | null;
  })[];
};

export const useEventDetail = (eventId: string | undefined) => {
  const [event, setEvent] = useState<EventDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEvent = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          event_role_requirements(*),
          event_invitations(
            status,
            profiles(id, full_name, email, avatar_url)
          )
        `)
        .eq('id', eventId)
        .single();

      if (fetchError) throw fetchError;

      setEvent(data as EventDetailType);

    } catch (err) {
      console.error('Error fetching event details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('single')) {
          setError('Programme not found.');
          toast({
              title: "🔍 Programme not found",
              description: "The programme you are looking for does not exist.",
              variant: "destructive",
          });
      } else {
          setError(errorMessage);
          toast({
              title: "❌ Failed to load programme details",
              description: "Please check your connection and try again.",
              variant: "destructive",
          });
      }
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    fetchEvent();

    if (eventId) {
        const channel = supabase
          .channel(`event-details-${eventId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
            () => { console.log('refetching event'); fetchEvent(); }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'event_role_requirements', filter: `event_id=eq.${eventId}` },
            () => { console.log('refetching reqs'); fetchEvent(); }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'event_invitations', filter: `event_id=eq.${eventId}` },
            () => { console.log('refetching invites'); fetchEvent(); }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
    }
  }, [eventId, fetchEvent]);

  return { event, loading, error, refetch: fetchEvent };
};
