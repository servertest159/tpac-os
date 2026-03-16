
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GearItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  available: number;
  condition: string;
  last_maintenance?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  photo_url?: string | null;
  uploaded_at?: string;
}

const CACHE_KEY = 'tpac_gear_cache';
const CACHE_TIMESTAMP_KEY = 'tpac_gear_cache_timestamp';

const loadCache = (): GearItem[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (cached && timestamp) {
      const cacheAge = Date.now() - parseInt(timestamp);
      if (cacheAge < 5 * 60 * 1000) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error loading cache:', error);
  }
  return null;
};

const saveCache = (data: GearItem[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving cache:', error);
  }
};

export const useGearInventory = () => {
  const [gear, setGear] = useState<GearItem[]>(() => loadCache() || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchGear = useCallback(async (attempt = 0): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('gear')
        .select('*')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const gearData = data || [];
      setGear(gearData);
      saveCache(gearData);
      setRetryCount(0);

      if (attempt > 0) {
        toastRef.current({
          title: "✅ Gear inventory loaded",
          description: "Successfully reconnected to database.",
        });
      }
    } catch (err) {
      console.error('Error fetching gear:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setRetryCount(attempt + 1);

      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => fetchGear(attempt + 1), delay);
      } else {
        const cached = loadCache();
        if (cached) {
          setGear(cached);
          toastRef.current({
            title: "⚠️ Using cached data",
            description: "Showing last known gear inventory. Connection issues detected.",
            variant: "destructive",
          });
        } else {
          toastRef.current({
            title: "❌ Failed to load gear inventory",
            description: "Please check your connection and try again.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteGear = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('gear')
        .delete()
        .eq('id', id);

      if (error) throw error;
      // Real-time subscription will handle UI update
    } catch (error) {
      console.error('Error deleting gear:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchGear();

    const channel = supabase
      .channel('gear-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gear'
        },
        (payload) => {
          console.log('Real-time gear update:', payload.eventType, payload);

          if (payload.eventType === 'INSERT') {
            setGear(prev => {
              // Avoid duplicates
              if (prev.some(item => item.id === (payload.new as GearItem).id)) return prev;
              const updated = [payload.new as GearItem, ...prev];
              saveCache(updated);
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            setGear(prev => {
              const updated = prev.map(item =>
                item.id === payload.new.id ? payload.new as GearItem : item
              );
              saveCache(updated);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            setGear(prev => {
              const updated = prev.filter(item => item.id !== payload.old.id);
              saveCache(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Stable — no deps that change

  const refetch = useCallback(() => {
    setRetryCount(0);
    fetchGear();
  }, [fetchGear]);

  return {
    gear,
    loading,
    error,
    retryCount,
    deleteGear,
    refetch
  };
};
