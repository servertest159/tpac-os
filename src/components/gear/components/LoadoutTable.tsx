
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { LoadoutItem } from "../types/LoadoutTypes";
import { getStatusBadge, getConditionBadge } from "../utils/badgeUtils";

interface LoadoutTableProps {
  items: LoadoutItem[];
  searchQuery: string;
  onItemCheck: (itemId: string, checked: boolean) => void;
}

const LoadoutTable: React.FC<LoadoutTableProps> = ({
  items,
  searchQuery,
  onItemCheck
}) => {
  return (
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
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No gear found matching your search." : "No gear items in inventory."}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={(checked) => 
                      onItemCheck(item.id, checked as boolean)
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
                <TableCell>
                  {getStatusBadge(item.quantityAvailable, item.quantityRequired)}
                </TableCell>
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
  );
};

export default LoadoutTable;
