
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import LoadoutHeader from "./components/LoadoutHeader";
import LoadoutTable from "./components/LoadoutTable";
import LoadoutLoadingState from "./components/LoadoutLoadingState";
import { useLoadoutLogic } from "./hooks/useLoadoutLogic";

const LoadoutChecker = () => {
  const {
    loading,
    searchQuery,
    setSearchQuery,
    filteredItems,
    handleItemCheck,
    handleCompleteLoadoutCheck,
    checkedCount,
    totalItems
  } = useLoadoutLogic();

  if (loading) {
    return <LoadoutLoadingState />;
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
        <LoadoutHeader
          checkedCount={checkedCount}
          totalItems={totalItems}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCompleteCheck={handleCompleteLoadoutCheck}
        />
        <CardContent>
          <LoadoutTable
            items={filteredItems}
            searchQuery={searchQuery}
            onItemCheck={handleItemCheck}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadoutChecker;
