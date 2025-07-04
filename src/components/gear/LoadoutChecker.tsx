
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useGearInventory } from "@/hooks/useGearInventory";
import { Package, Search, CheckCircle, AlertTriangle, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadoutItem {
  id: string;
  name: string;
  type: string;
  quantityRequired: number;
  quantityAvailable: number;
  condition: string;
  checked: boolean;
  notes?: string;
}

const LoadoutChecker = () => {
  const { gear, loading } = useGearInventory();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const loadoutItems: LoadoutItem[] = useMemo(() => {
    return gear.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      quantityRequired: 1, // Default required quantity
      quantityAvailable: item.available,
      condition: item.condition,
      checked: checkedItems[item.id] || false,
      notes: item.notes || undefined,
    }));
  }, [gear, checkedItems]);

  const filteredItems = useMemo(() => {
    return loadoutItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [loadoutItems, searchQuery]);

  const handleItemCheck = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const getStatusBadge = (item: LoadoutItem) => {
    if (item.quantityAvailable >= item.quantityRequired) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>;
    } else if (item.quantityAvailable > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partial</Badge>;
    } else {
      return <Badge variant="destructive">Unavailable</Badge>;
    }
  };

  const getConditionBadge = (condition: string) => {
    const variant = condition === 'Good' ? 'default' : 
                   condition === 'Fair' ? 'secondary' : 'destructive';
    return <Badge variant={variant}>{condition}</Badge>;
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = filteredItems.length;

  const handleCompleteLoadoutCheck = () => {
    const checkedItemsList = filteredItems.filter(item => checkedItems[item.id]);
    const unavailableItems = checkedItemsList.filter(item => item.quantityAvailable < item.quantityRequired);
    
    if (unavailableItems.length > 0) {
      toast({
        title: "⚠️ Loadout Check Complete - Issues Found",
        description: `${unavailableItems.length} item(s) have availability issues. Review before deployment.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ Loadout Check Complete",
        description: `All ${checkedItemsList.length} checked items are ready for deployment.`,
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          Check Inventory Loadout
        </h1>
        <p className="text-muted-foreground">
          Verify gear availability and condition before programme deployment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory Loadout Status</CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {checkedCount} of {totalItems} items checked
              </span>
              <Button 
                onClick={handleCompleteLoadoutCheck}
                disabled={checkedCount === 0}
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Complete Check
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search gear by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Check</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Req'd</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No gear found matching your search." : "No gear items in inventory."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={(checked) => 
                            handleItemCheck(item.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.quantityRequired}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.quantityAvailable}
                          {item.quantityAvailable >= item.quantityRequired ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item)}</TableCell>
                      <TableCell>{getConditionBadge(item.condition)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadoutChecker;
