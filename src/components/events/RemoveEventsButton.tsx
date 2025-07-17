
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { removeSpecificEvents } from '@/utils/removeSpecificEvents';
import { useToast } from '@/hooks/use-toast';

const RemoveEventsButton = ({ onRemovalComplete }: { onRemovalComplete?: () => void }) => {
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    
    const result = await removeSpecificEvents();
    
    if (result.success) {
      onRemovalComplete?.();
    }
    
    setIsRemoving(false);
  };

  return (
    <Button 
      onClick={handleRemove}
      disabled={isRemoving}
      variant="destructive"
      size="sm"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isRemoving ? 'Removing...' : 'Remove Pulau Ubin Programmes'}
    </Button>
  );
};

export default RemoveEventsButton;
