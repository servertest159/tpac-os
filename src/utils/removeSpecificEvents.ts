
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const removeSpecificEvents = async () => {
  const { toast } = useToast();
  
  try {
    // Remove the specific events by title
    const { error } = await supabase
      .from('events')
      .delete()
      .in('title', ['Pulau Ubin Camp', 'Pulau Ubin Bonding Camp']);

    if (error) throw error;

    toast({
      title: "✅ Programmes Removed",
      description: "Pulau Ubin programmes have been successfully removed from the system.",
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing events:', error);
    toast({
      title: "❌ Failed to remove programmes",
      description: error instanceof Error ? error.message : "An error occurred while removing the programmes.",
      variant: "destructive",
    });
    return { success: false, error };
  }
};
