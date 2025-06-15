
import { useState, useEffect, useCallback } from 'react';
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

export const useGearInventory = () => {
  const [gear, setGear] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  // Cache key for localStorage
  const CACHE_KEY = 'tpac_gear_cache';
  const CACHE_TIMESTAMP_KEY = 'tpac_gear_cache_timestamp';

  // Load cached data
  const loadCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp);
        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setGear(JSON.parse(cached));
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
    return false;
  }, []);

  // Save to cache
  const saveCache = useCallback((data: GearItem[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }, []);

  // Fetch gear with retry logic
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
        toast({
          title: "✅ Gear inventory loaded",
          description: "Successfully reconnected to database.",
        });
      }
    } catch (err) {
      console.error('Error fetching gear:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setRetryCount(attempt + 1);

      // Retry up to 3 times with exponential backoff
      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        setTimeout(() => fetchGear(attempt + 1), delay);
      } else {
        // Load cache as fallback
        const cacheLoaded = loadCache();
        if (cacheLoaded) {
          toast({
            title: "⚠️ Using cached data",
            description: "Showing last known gear inventory. Connection issues detected.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "❌ Failed to load gear inventory",
            description: "Please check your connection and try again.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [loadCache, saveCache, toast]);

  // Delete gear item
  const deleteGear = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('gear')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Optimistically update UI
      setGear(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting gear:', error);
      throw error;
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    // Initial load with cache fallback
    const cacheLoaded = loadCache();
    if (cacheLoaded) {
      setLoading(false);
    }
    
    fetchGear();

    // Set up real-time subscription
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
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setGear(prev => [payload.new as GearItem, ...prev]);
            toast({
              title: "✅ New gear added",
              description: `${(payload.new as GearItem).name} has been added to inventory.`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setGear(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new as GearItem : item
            ));
            toast({
              title: "✅ Gear updated",
              description: `${(payload.new as GearItem).name} has been updated.`,
            });
          } else if (payload.eventType === 'DELETE') {
            setGear(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGear, loadCache, toast]);

  // Refetch function for manual refresh
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
