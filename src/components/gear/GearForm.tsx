import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UploadCloud, X } from "lucide-react";
import ImagePreview from "./ImagePreview";
import { supabase } from "@/integrations/supabase/client";
import type { GearItem } from "@/hooks/useGearInventory";
import { FormSkeleton } from "@/components/ui/loading-states";

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
    photo_url: null as string | null,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (isEditing && gearId) {
      fetchGear();
    }
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [isEditing, gearId]);

  const fetchGear = async (attempt = 0) => {
    try {
      setFetchLoading(true);
      
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

      const gearData = data as GearItem | null;

      if (!gearData) {
        toast({
          title: "❌ Gear not found",
          description: "The requested gear item could not be found.",
          variant: "destructive",
        });
        navigate("/gear");
        return;
      }

      setFormData({
        name: gearData.name,
        type: gearData.type,
        quantity: gearData.quantity,
        available: gearData.available,
        condition: gearData.condition,
        last_maintenance: gearData.last_maintenance || "",
        notes: gearData.notes || "",
        photo_url: gearData.photo_url || null,
      });
      if (gearData.photo_url) {
        setImagePreview(gearData.photo_url);
      }
      setRetryAttempt(0);
    } catch (error) {
      console.error('Error fetching gear:', error);
      setRetryAttempt(attempt + 1);
      
      if (attempt < 2) {
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
    
    try {
        const sanitizedFormData = {
          ...formData,
          last_maintenance: formData.last_maintenance || null,
        };

        let gearIdToUpdate = gearId;
        const isNewItem = !isEditing;

        if (isNewItem) {
            const { data: newGear, error: insertError } = await supabase
                .from('gear')
                .insert([{ ...sanitizedFormData, photo_url: null, uploaded_at: null }])
                .select('id')
                .single();

            if (insertError) throw insertError;
            gearIdToUpdate = newGear.id;
        }

        let finalPhotoUrl = sanitizedFormData.photo_url;
        let uploadedTimestamp: string | null = null;
        let photoChanged = false;

        if (imageFile && gearIdToUpdate) {
            photoChanged = true;
            setIsUploading(true);
            const filePath = `${gearIdToUpdate}/${Date.now()}-${imageFile.name}`;
            
            const { error: uploadError } = await supabase.storage
                .from('gear-uploads')
                .upload(filePath, imageFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('gear-uploads')
                .getPublicUrl(filePath);
            
            finalPhotoUrl = urlData.publicUrl;
            uploadedTimestamp = new Date().toISOString();
            setIsUploading(false);
        } else if (!imagePreview && isEditing) {
            photoChanged = true;
            finalPhotoUrl = null;
            uploadedTimestamp = null;
        }
        
        const gearDataToUpdate: { [key: string]: any } = { ...sanitizedFormData };
        
        if (photoChanged) {
            gearDataToUpdate.photo_url = finalPhotoUrl;
            gearDataToUpdate.uploaded_at = uploadedTimestamp;
        }
        
        if (isEditing || photoChanged) {
            const { error: updateError } = await supabase
                .from('gear')
                .update(gearDataToUpdate)
                .eq('id', gearIdToUpdate!);
            
            if (updateError) throw updateError;
        }
        
        toast({
            title: "✅ Gear saved",
            description: `Successfully ${isEditing ? "updated" : "added"} ${formData.name}.`,
        });
        navigate("/gear");

    } catch (error) {
        console.error('Error saving gear:', error);
        setIsUploading(false);
        toast({
            title: "❌ Failed to save gear",
            description: "An error occurred. Please try again.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/heic", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "❌ Invalid file type",
        description: "Please select a JPG, PNG, or HEIC image.",
        variant: "destructive",
      });
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      toast({
        title: "❌ File too large",
        description: "Please choose a photo smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, photo_url: null }));
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

  if (fetchLoading) {
    return <FormSkeleton />;
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
            <Label htmlFor="photo">Photo</Label>
            {imagePreview ? (
              <ImagePreview imageUrl={imagePreview} onRemove={handleRemoveImage} />
            ) : (
              <div className="flex items-center justify-center w-full">
                <Label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, or HEIC (MAX. 5MB)</p>
                  </div>
                  <Input id="photo-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/png, image/jpeg, image/jpg, image/heic" />
                </Label>
              </div>
            )}
            {isUploading && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Uploading photo...</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || isUploading}>
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
