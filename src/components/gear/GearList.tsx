
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface GearItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  available: number;
  condition: string;
  last_maintenance: string;
  notes?: string;
}

const GearList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch gear data from Supabase
  const { data: gearItems = [], isLoading, error } = useQuery({
    queryKey: ['gear'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gear')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as GearItem[];
    }
  });

  // Delete gear mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gear')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gear'] });
      toast({
        title: "Gear Item Deleted",
        description: "The gear item has been successfully deleted."
      });
      setShowDeleteDialog(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete gear item: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const filteredGear = gearItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading gear inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-4 mb-2">Error loading gear</h3>
        <p className="text-muted-foreground mb-4">
          {error.message}
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['gear'] })}>
          Retry
        </Button>
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
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  {getConditionBadge(item.condition)}
                </div>
                <p className="text-sm text-muted-foreground">{item.type}</p>
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
                    <span className="font-medium">{item.last_maintenance ? new Date(item.last_maintenance).toLocaleDateString() : 'Not recorded'}</span>
                  </div>
                  {item.notes && (
                    <div>
                      <span className="text-sm text-muted-foreground block">Notes:</span>
                      <p className="text-sm mt-1">{item.notes}</p>
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
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
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
