
import React from "react";
import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (quantityAvailable: number, quantityRequired: number) => {
  if (quantityAvailable >= quantityRequired) {
    return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>;
  } else if (quantityAvailable > 0) {
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partial</Badge>;
  } else {
    return <Badge variant="destructive">Unavailable</Badge>;
  }
};

export const getConditionBadge = (condition: string) => {
  const variant = condition === 'Good' ? 'default' : 
                 condition === 'Fair' ? 'secondary' : 'destructive';
  return <Badge variant={variant}>{condition}</Badge>;
};
