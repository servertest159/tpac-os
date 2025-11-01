
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface GearFormProps {
  gearId?: string;
}

const GearForm: React.FC<GearFormProps> = ({ gearId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!gearId;
  
  // Sample gear data for editing (in a real app, would fetch from API)
  const gearData = isEditing
    ? {
        name: "Tents - 2 Person",
        type: "Shelter",
        quantity: 5,
        condition: "Good",
        notes: "These are our newest tents, purchased in January.",
        lastMaintenance: "2025-03-15",
      }
    : {
        name: "",
        type: "",
        quantity: 1,
        condition: "Good",
        notes: "",
        lastMaintenance: new Date().toISOString().split("T")[0],
      };

  const [formData, setFormData] = React.useState(gearData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: isEditing ? "Gear Updated" : "Gear Added",
        description: `Successfully ${isEditing ? "updated" : "added"} ${formData.name}`,
      });
      navigate("/gear");
    }, 500);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
                id="lastMaintenance"
                name="lastMaintenance"
                type="date"
                value={formData.lastMaintenance}
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
          <Button type="submit">
            {isEditing ? "Update Item" : "Add Item"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default GearForm;
