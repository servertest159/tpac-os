import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Edit, Trash2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import GearPhotoPreview from "./GearPhotoPreview";
import { useGearInventory } from "@/hooks/useGearInventory";

const GearList = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<string | null>(null);
  
  const { 
    gear, 
    loading, 
    error, 
    retryCount, 
    deleteGear, 
    refetch 
  } = useGearInventory();

  const filteredGear = gear.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteGear(id);
      toast({
        title: "✅ Gear item deleted",
        description: `${name} has been successfully removed from inventory.`,
      });
      setShowDeleteDialog(null);
    } catch (error) {
      console.error('Error deleting gear:', error);
      toast({
        title: "❌ Failed to delete gear item",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "excellent":
        return <Badge variant="default" className="bg-green-600">Excellent</Badge>;
      case "good":
        return <Badge variant="default" className="bg-forest">Good</Badge>;
      case "fair":
        return <Badge variant="secondary">Fair</Badge>;
      case "poor":
      case "needs repair":
        return <Badge variant="destructive">Needs Repair</Badge>;
      default:
        return <Badge>{condition}</Badge>;
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="card-hover">
          <CardHeader className="pb-2">
            <div className="flex gap-3 items-start">
              <Skeleton className="w-16 h-16 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-8 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  // Error state with retry
  if (error && retryCount >= 3) {
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

        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 mb-2">Failed to load gear inventory</h3>
          <p className="text-muted-foreground mb-4">
            Unable to connect to the database after multiple attempts.
          </p>
          <Button onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search gear..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {(loading || retryCount > 0) && (
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        )}
      </div>

      {loading && gear.length === 0 ? (
        <LoadingSkeleton />
      ) : filteredGear.length === 0 ? (
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
                  <GearPhotoPreview 
                    gearName={item.name} 
                    photoUrl={item.photo_url}
                    uploadedAt={item.uploaded_at}
                    className="w-16 h-16 flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <CardTitle className="text-lg truncate">{item.name}</CardTitle>
                      {getConditionBadge(item.condition)}
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
                  {item.last_maintenance && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Maintenance:</span>
                      <span className="font-medium">{new Date(item.last_maintenance).toLocaleDateString()}</span>
                    </div>
                  )}
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
                      <Button variant="destructive" onClick={() => handleDelete(item.id, item.name)}>
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
