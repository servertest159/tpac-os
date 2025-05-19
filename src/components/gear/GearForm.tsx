
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface GearFormProps {
  gearId?: string;
}

interface GearFormData {
  name: string;
  type: string;
  quantity: number;
  available?: number;
  condition: string;
  notes: string;
  last_maintenance: string;
}

const GearForm: React.FC<GearFormProps> = ({ gearId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!gearId;
  
  const initialFormData: GearFormData = {
    name: "",
    type: "",
    quantity: 1,
    available: 1,
    condition: "Good",
    notes: "",
    last_maintenance: new Date().toISOString().split("T")[0],
  };

  const [formData, setFormData] = useState<GearFormData>(initialFormData);
  // Add state for session checking
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  // Check for an active session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        setSessionError(true);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to manage gear. Please sign in.",
          variant: "destructive"
        });
      }
      
      setIsSessionChecked(true);
    };
    
    checkSession();
  }, [toast]);

  // Fetch gear item data if editing an existing item
  const { isLoading } = useQuery({
    queryKey: ['gear', gearId],
    queryFn: async () => {
      if (!gearId) return null;
      
      const { data, error } = await supabase
        .from('gear')
        .select('*')
        .eq('id', gearId)
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      if (data) {
        // Format date for input field
        let formattedData = {
          ...data,
          last_maintenance: data.last_maintenance ? 
            new Date(data.last_maintenance).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0]
        };
        setFormData(formattedData);
      }
      
      return data;
    },
    enabled: !!gearId && isSessionChecked && !sessionError
  });

  // Create or update gear mutation
  const mutation = useMutation({
    mutationFn: async (data: GearFormData) => {
      // Check for active session before proceeding
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("You must be logged in to manage gear");
      }
      
      if (isEditing) {
        const { error } = await supabase
          .from('gear')
          .update(data)
          .eq('id', gearId);
        
        if (error) throw new Error(error.message);
        return { message: "Gear Updated" };
      } else {
        // For new items, set available = quantity
        const newData = { ...data, available: data.quantity };
        const { error } = await supabase
          .from('gear')
          .insert([newData]);
          
        if (error) throw new Error(error.message);
        return { message: "Gear Added" };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gear'] });
      toast({
        title: isEditing ? "Gear Updated" : "Gear Added",
        description: `Successfully ${isEditing ? "updated" : "added"} ${formData.name}`
      });
      navigate("/gear");
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'quantity' || name === 'available' ? Number(value) : value 
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate("/gear");
  };

  const gearTypes = [
    "Shelter",
    "Sleep",
    "Cooking",
    "Equipment",
    "Carry",
    "Safety",
    "Clothing",
    "Other",
  ];
  
  const conditions = ["Excellent", "Good", "Fair", "Poor"];

  if (sessionError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You need to be logged in to manage gear inventory.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => navigate("/auth")}>
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if ((isEditing && isLoading) || !isSessionChecked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Gear Item" : "Add Gear Item"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter gear item name"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {gearTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleSelectChange("condition", value)}
              >
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
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
              <Label htmlFor="lastMaintenance">Last Maintenance</Label>
              <Input
                id="last_maintenance"
                name="last_maintenance"
                type="date"
                value={formData.last_maintenance}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information about this gear"
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 
              (isEditing ? "Updating..." : "Adding...") : 
              (isEditing ? "Update Item" : "Add Item")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default GearForm;
