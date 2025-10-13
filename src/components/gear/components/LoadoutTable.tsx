
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
    <div className="rounded-md border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">Check</TableHead>
              <TableHead className="font-semibold">Item Name</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Req'd</TableHead>
              <TableHead className="font-semibold">Available</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Condition</TableHead>
              <TableHead className="font-semibold">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium">
                      {searchQuery ? "No gear found matching your search." : "No gear items in inventory."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow 
                  key={item.id}
                  className={`
                    transition-colors duration-150 
                    hover:bg-muted/50 
                    ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                    ${item.checked ? 'bg-primary/5' : ''}
                  `}
                >
                  <TableCell>
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(checked) => 
                        onItemCheck(item.id, checked as boolean)
                      }
                      className="transition-all duration-200"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.type}</TableCell>
                  <TableCell className="text-center">{item.quantityRequired}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.quantityAvailable}</span>
                      {item.quantityAvailable >= item.quantityRequired ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.quantityAvailable, item.quantityRequired)}
                  </TableCell>
                  <TableCell>{getConditionBadge(item.condition)}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {item.notes || <span className="text-muted-foreground/50">-</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LoadoutTable;
