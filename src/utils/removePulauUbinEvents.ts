import { supabase } from '@/integrations/supabase/client';

export const removePulauUbinEvents = async () => {
  try {
    // Remove the specific Pulau Ubin events
    const { error } = await supabase
      .from('events')
      .delete()
      .in('id', ['a70e8ae5-6b93-4f35-9ce0-dd7bfa73e2b2', '4870000d-44d3-4d74-9ac0-bd5e179a038e']);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing Pulau Ubin events:', error);
    return { success: false, error };
  }
};