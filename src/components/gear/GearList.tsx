
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import GearPhotoPreview from "./GearPhotoPreview";

// Sample data for gear items with photo URLs
const gearItems = [
  {
    id: "1",
    name: "Tents - 2 Person",
    type: "Shelter",
    quantity: 5,
    available: 3,
    condition: "Good",
    lastMaintenance: "2025-03-15",
    photoUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    name: "Sleeping Bags - Winter",
    type: "Sleep",
    quantity: 10,
    available: 8,
    condition: "Excellent",
    lastMaintenance: "2025-04-02",
    photoUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    name: "Hiking Poles",
    type: "Equipment",
    quantity: 12,
    available: 7,
    condition: "Fair",
    lastMaintenance: "2025-01-20",
    needsMaintenance: true,
  },
  {
    id: "4",
    name: "Water Filters",
    type: "Equipment",
    quantity: 3,
    available: 0,
    condition: "Good",
    lastMaintenance: "2025-02-10",
    photoUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=300&fit=crop",
  },
  {
    id: "5",
    name: "First Aid Kits",
    type: "Safety",
    quantity: 5,
    available: 4,
    condition: "Good",
    lastMaintenance: "2025-04-05",
    photoUrl: "https://images.unsplash.com/photo-1603398938425-d3cd0ebb4f77?w=400&h=300&fit=crop",
  },
  {
    id: "6",
    name: "Backpacks - 50L",
    type: "Carry",
    quantity: 8,
    available: 2,
    condition: "Good",
    lastMaintenance: "2025-03-22",
  },
];

const GearList = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<string | null>(null);

  const filteredGear = gearItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    // Simulate API call to delete
    setTimeout(() => {
      toast({
        title: "Gear Item Deleted",
        description: "The gear item has been successfully deleted.",
      });
      setShowDeleteDialog(null);
    }, 500);
  };

  const getConditionBadge = (condition: string, needsMaintenance?: boolean) => {
    if (needsMaintenance) {
      return <Badge variant="destructive">Needs Maintenance</Badge>;
    }
    
    switch (condition.toLowerCase()) {
      case "excellent":
        return <Badge variant="default" className="bg-green-600">Excellent</Badge>;
      case "good":
        return <Badge variant="default" className="bg-forest">Good</Badge>;
      case "fair":
        return <Badge variant="secondary">Fair</Badge>;
      case "poor":
        return <Badge variant="destructive">Poor</Badge>;
      default:
        return <Badge>{condition}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Gear Inventory</h1>
          <p className="text-muted-foreground">Manage your equipment</p>
        </div>
        <Button asChild>
          <Link to="/gear/new">Add Gear</Link>
        </Button>
      </div>

      <div className="flex items-center">
        <Input
          placeholder="Search gear..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredGear.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 mb-2">No gear items found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "There are no gear items matching your search."
              : "You haven't added any gear items yet."}
          </p>
          <Button asChild>
            <Link to="/gear/new">Add Gear Item</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGear.map((item) => (
            <Card key={item.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex gap-3 items-start">
                  {/* Photo thumbnail */}
                  <GearPhotoPreview 
                    gearName={item.name} 
                    photoUrl={item.photoUrl}
                    className="w-16 h-16 flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <CardTitle className="text-lg truncate">{item.name}</CardTitle>
                      {getConditionBadge(item.condition, item.needsMaintenance)}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{item.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Available:</span>
                    <span className="font-medium">{item.available}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Maintenance:</span>
                    <span className="font-medium">{new Date(item.lastMaintenance).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/gear/${item.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Dialog open={showDeleteDialog === item.id} onOpenChange={(open) => open ? setShowDeleteDialog(item.id) : setShowDeleteDialog(null)}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Gear Item</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete {item.name}? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(item.id)}>
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GearList;
