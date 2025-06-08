
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, Package } from 'lucide-react';

interface GearPhotoPreviewProps {
  gearName: string;
  photoUrl?: string;
  className?: string;
}

const GearPhotoPreview: React.FC<GearPhotoPreviewProps> = ({ 
  gearName, 
  photoUrl, 
  className = "" 
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const PlaceholderContent = () => (
    <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-muted-foreground">
      <Package className="h-8 w-8 mb-2" />
      <span className="text-xs text-center">No photo available</span>
    </div>
  );

  const ImageContent = () => {
    if (!photoUrl || imageError) {
      return <PlaceholderContent />;
    }

    return (
      <img
        src={photoUrl}
        alt={`${gearName} photo`}
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div 
          className={`relative cursor-pointer group overflow-hidden rounded-md bg-muted ${className}`}
          title={`View ${gearName} Photo`}
        >
          <ImageContent />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="secondary" size="sm" className="pointer-events-none">
              <ZoomIn className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[80vh] p-2">
        <div className="relative w-full">
          <h3 className="text-lg font-semibold mb-3 px-4">{gearName}</h3>
          <div className="w-full max-h-[60vh] overflow-hidden rounded-lg bg-muted flex items-center justify-center">
            {!photoUrl || imageError ? (
              <div className="py-20">
                <PlaceholderContent />
              </div>
            ) : (
              <img
                src={photoUrl}
                alt={`${gearName} full view`}
                className="max-w-full max-h-full object-contain"
                onError={handleImageError}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GearPhotoPreview;
