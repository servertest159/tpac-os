
import { useState, useMemo } from "react";
import { useGearInventory } from "@/hooks/useGearInventory";
import { useToast } from "@/hooks/use-toast";
import { LoadoutItem } from "../types/LoadoutTypes";

export const useLoadoutLogic = () => {
  const { gear, loading } = useGearInventory();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const loadoutItems: LoadoutItem[] = useMemo(() => {
    return gear.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      quantityRequired: 1,
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
    console.log(`Checking item ${itemId}: ${checked}`);
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const handleCompleteLoadoutCheck = () => {
    console.log('Complete Check button clicked');
    console.log('Checked items:', checkedItems);
    
    const checkedItemsList = filteredItems.filter(item => checkedItems[item.id]);
    console.log('Checked items list:', checkedItemsList);
    
    const unavailableItems = checkedItemsList.filter(item => item.quantityAvailable < item.quantityRequired);
    console.log('Unavailable items:', unavailableItems);
    
    if (unavailableItems.length > 0) {
      toast({
        title: "⚠️ Loadout Check Complete - Issues Found",
        description: `${unavailableItems.length} item(s) have availability issues. Review before deployment.`,
        variant: "destructive",
      });
    } else if (checkedItemsList.length > 0) {
      toast({
        title: "✅ Loadout Check Complete",
        description: `All ${checkedItemsList.length} checked items are ready for deployment.`,
      });
    } else {
      toast({
        title: "ℹ️ No Items Selected",
        description: "Please select items to check before completing the loadout check.",
        variant: "destructive",
      });
    }
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = filteredItems.length;

  return {
    loading,
    searchQuery,
    setSearchQuery,
    filteredItems,
    handleItemCheck,
    handleCompleteLoadoutCheck,
    checkedCount,
    totalItems
  };
};
