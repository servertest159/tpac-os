
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, Package } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GearPhotoPreviewProps {
  gearName: string;
  photoUrl?: string | null;
  uploadedAt?: string;
  className?: string;
}

const GearPhotoPreview: React.FC<GearPhotoPreviewProps> = ({ 
  gearName, 
  photoUrl, 
  uploadedAt,
  className = "" 
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const PlaceholderContent = () => (
    <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-muted-foreground rounded-md">
      <Package className="h-8 w-8 mb-2" />
      <span className="text-xs text-center">No photo</span>
    </div>
  );

  const ImageContent = () => {
    if (!photoUrl || imageError) {
      return <PlaceholderContent />;
    }

    return (
      <img
        src={photoUrl}
        alt={`Photo of ${gearName}`}
        className="w-full h-full object-cover rounded-md"
        onError={handleImageError}
        loading="lazy"
      />
    );
  };

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <DialogTrigger asChild>
              <div 
                className={`relative cursor-pointer group overflow-hidden rounded-md bg-muted ${className}`}
              >
                <ImageContent />
                
                {photoUrl && !imageError && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>👀 View full photo of {gearName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DialogContent className="max-w-3xl max-h-[90vh] p-2">
        <div className="relative w-full">
          <div className="p-4">
            <h3 className="text-lg font-semibold">{gearName}</h3>
            {uploadedAt && (
                <p className="text-sm text-muted-foreground">
                  Uploaded on: {new Date(uploadedAt).toLocaleDateString()}
                </p>
            )}
          </div>
          <div className="w-full max-h-[75vh] overflow-hidden rounded-lg bg-muted flex items-center justify-center">
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
