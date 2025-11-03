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
        return <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white border-0 shadow-sm">Excellent</Badge>;
      case "good":
        return <Badge className="bg-gradient-to-r from-primary to-primary-glow text-white border-0 shadow-sm">Good</Badge>;
      case "fair":
        return <Badge variant="secondary" className="shadow-sm">Fair</Badge>;
      case "poor":
      case "needs repair":
        return <Badge variant="destructive" className="shadow-sm">Needs Repair</Badge>;
      default:
        return <Badge className="shadow-sm">{condition}</Badge>;
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
            <h1>Inventory</h1>
            <p className="text-muted-foreground">Track and maintain your kit.</p>
          </div>
          <Button asChild>
            <Link to="/gear/new">Log New Gear</Link>
          </Button>
        </div>

        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 mb-2">Failed to load inventory</h3>
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
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1>Inventory</h1>
          <p className="text-muted-foreground">Track and maintain your kit.</p>
        </div>
        <Button asChild>
          <Link to="/gear/new">Log New Gear</Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search inventory..."
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
          <h3 className="mt-4 mb-2">Inventory is Empty</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "No gear matches your search."
              : "Log your first piece of gear to get started."}
          </p>
          <Button asChild>
            <Link to="/gear/new">Log Gear Item</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGear.map((item, index) => (
            <Card key={item.id} className="card-premium card-hover hover-lift animate-fade-in overflow-hidden" style={{ animationDelay: `${index * 0.05}s` }}>
              <CardHeader className="pb-3">
                <div className="flex gap-4 items-start">
                  <GearPhotoPreview 
                    gearName={item.name} 
                    photoUrl={item.photo_url}
                    uploadedAt={item.uploaded_at}
                    className="w-20 h-20 flex-shrink-0 ring-2 ring-border/50"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <CardTitle className="text-lg truncate leading-tight">{item.name}</CardTitle>
                      {getConditionBadge(item.condition)}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{item.type}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <span className="text-xs text-muted-foreground block mb-1">Total</span>
                    <span className="text-xl font-bold text-foreground">{item.quantity}</span>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center ring-1 ring-primary/20">
                    <span className="text-xs text-muted-foreground block mb-1">Available</span>
                    <span className="text-xl font-bold text-primary">{item.available}</span>
                  </div>
                </div>
                {item.last_maintenance && (
                  <div className="flex items-center justify-between text-sm px-2 py-1.5 bg-muted/30 rounded-md">
                    <span className="text-muted-foreground">Last Maintenance</span>
                    <span className="font-medium">{new Date(item.last_maintenance).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 pt-4 border-t bg-muted/20">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/gear/${item.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Dialog open={showDeleteDialog === item.id} onOpenChange={(open) => open ? setShowDeleteDialog(item.id) : setShowDeleteDialog(null)}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex-1">
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
