import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { removePulauUbinEvents } from '@/utils/removePulauUbinEvents';

const RemovePulauUbinButton = () => {
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const result = await removePulauUbinEvents();
      
      if (result.success) {
        toast({
          title: "✅ Events Removed",
          description: "Pulau Ubin camp programmes have been removed successfully.",
        });
      } else {
        toast({
          title: "❌ Error",
          description: "Failed to remove Pulau Ubin events. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Button
      onClick={handleRemove}
      disabled={isRemoving}
      variant="destructive"
      size="sm"
    >
      {isRemoving ? "Removing..." : "Remove Pulau Ubin Camps"}
    </Button>
  );
};

export default RemovePulauUbinButton;