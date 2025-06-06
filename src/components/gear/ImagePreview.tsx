
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  imageUrl: string;
  onRemove: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onRemove }) => {
  return (
    <div className="relative inline-block">
      <img
        src={imageUrl}
        alt="Gear item"
        className="w-32 h-32 object-cover rounded-lg border"
      />
      <Button
        variant="destructive"
        size="sm"
        onClick={onRemove}
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default ImagePreview;
