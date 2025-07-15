
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileCheck } from "lucide-react";

interface LoadoutHeaderProps {
  checkedCount: number;
  totalItems: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCompleteCheck: () => void;
}

const LoadoutHeader: React.FC<LoadoutHeaderProps> = ({
  checkedCount,
  totalItems,
  searchQuery,
  onSearchChange,
  onCompleteCheck
}) => {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Inventory Loadout Status</CardTitle>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {checkedCount} of {totalItems} items checked
          </span>
          <Button 
            onClick={onCompleteCheck}
            className="bg-blue-600 hover:bg-blue-700"
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
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
    </CardHeader>
  );
};

export default LoadoutHeader;
