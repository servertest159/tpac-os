import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";
import CameraCapture from "./CameraCapture";
import ImagePreview from "./ImagePreview";
import { supabase } from "@/integrations/supabase/client";

interface GearFormProps {
  gearId?: string;
}

const GearForm: React.FC<GearFormProps> = ({ gearId: propGearId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: urlGearId } = useParams();
  const gearId = propGearId || urlGearId;
  const isEditing = !!gearId;
  
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    quantity: 1,
    available: 1,
    condition: "Good",
    last_maintenance: "",
    notes: "",
  });

  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (isEditing && gearId) {
      fetchGear();
    }
  }, [isEditing, gearId]);

  const fetchGear = async (attempt = 0) => {
    try {
      setFetchLoading(true);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(gearId!)) {
        throw new Error('Invalid gear ID format');
      }

      const { data, error } = await supabase
        .from('gear')
        .select('*')
        .eq('id', gearId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "❌ Gear not found",
          description: "The requested gear item could not be found.",
          variant: "destructive",
        });
        navigate("/gear");
        return;
      }

      setFormData({
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        available: data.available,
        condition: data.condition,
        last_maintenance: data.last_maintenance || "",
        notes: data.notes || "",
      });
      setRetryAttempt(0);
    } catch (error) {
      console.error('Error fetching gear:', error);
      setRetryAttempt(attempt + 1);
      
      if (attempt < 2) {
        // Retry up to 3 times
        setTimeout(() => fetchGear(attempt + 1), 1000 * (attempt + 1));
      } else {
        toast({
          title: "❌ Failed to load gear",
          description: "Unable to load gear data. Please try again.",
          variant: "destructive",
        });
        navigate("/gear");
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let saveAttempt = 0;
    const maxRetries = 3;
    
    const attemptSave = async (): Promise<boolean> => {
      try {
        const gearData = {
          name: formData.name,
          type: formData.type,
          quantity: formData.quantity,
          available: formData.available,
          condition: formData.condition,
          last_maintenance: formData.last_maintenance || null,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        };

        if (isEditing && gearId) {
          const { error } = await supabase
            .from('gear')
            .update(gearData)
            .eq('id', gearId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('gear')
            .insert([gearData]);

          if (error) throw error;
        }

        toast({
          title: "✅ Gear saved",
          description: `Successfully ${isEditing ? "updated" : "added"} ${formData.name}`,
        });
        navigate("/gear");
        return true;
      } catch (error) {
        console.error('Error saving gear:', error);
        saveAttempt++;
        
        if (saveAttempt < maxRetries) {
          toast({
            title: "⚠️ Retrying save",
            description: `Attempt ${saveAttempt + 1} of ${maxRetries}...`,
          });
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * saveAttempt));
          return attemptSave();
        } else {
          throw error;
        }
      }
    };

    try {
      await attemptSave();
    } catch (error) {
      console.error('Final save error:', error);
      toast({
        title: "❌ Failed to save gear item",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'quantity' || name === 'available' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate("/gear");
  };

  const handleCameraCapture = (imageBlob: Blob) => {
    const imageDataUrl = URL.createObjectURL(imageBlob);
    setCapturedImage(imageDataUrl);
    setShowCamera(false);
  };

  const handleRemoveImage = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  if (fetchLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Gear...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          {retryAttempt > 0 && (
            <p className="ml-3 text-muted-foreground">
              Retry attempt {retryAttempt}/3
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Gear" : "Add New Gear"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Gear Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter gear name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gear type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tent">Tent</SelectItem>
                <SelectItem value="backpack">Backpack</SelectItem>
                <SelectItem value="sleeping-bag">Sleeping Bag</SelectItem>
                <SelectItem value="cooking">Cooking Equipment</SelectItem>
                <SelectItem value="navigation">Navigation</SelectItem>
                <SelectItem value="safety">Safety Equipment</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Total Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="available">Available</Label>
              <Input
                id="available"
                name="available"
                type="number"
                value={formData.available}
                onChange={handleChange}
                min={0}
                max={formData.quantity}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select
              value={formData.condition}
              onValueChange={(value) => handleSelectChange("condition", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Poor">Poor</SelectItem>
                <SelectItem value="Needs Repair">Needs Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_maintenance">Last Maintenance Date</Label>
            <Input
              id="last_maintenance"
              name="last_maintenance"
              type="date"
              value={formData.last_maintenance}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this gear"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
              {capturedImage && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveImage}
                >
                  Remove Photo
                </Button>
              )}
            </div>
            {capturedImage && (
              <ImagePreview 
                imageUrl={capturedImage} 
                onRemove={handleRemoveImage} 
              />
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              isEditing ? "Update Gear" : "Add Gear"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default GearForm;
