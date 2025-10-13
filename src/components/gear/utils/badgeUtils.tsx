
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export const getStatusBadge = (quantityAvailable: number, quantityRequired: number) => {
  if (quantityAvailable >= quantityRequired) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 gap-1">
        <CheckCircle className="h-3 w-3" />
        Available
      </Badge>
    );
  } else if (quantityAvailable > 0) {
    return (
      <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1">
        <AlertTriangle className="h-3 w-3" />
        Partial
      </Badge>
    );
  } else {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Unavailable
      </Badge>
    );
  }
};

export const getConditionBadge = (condition: string) => {
  if (condition === "Good") {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 gap-1">
        <CheckCircle className="h-3 w-3" />
        Good
      </Badge>
    );
  }
  
  if (condition === "Fair") {
    return (
      <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1">
        <AlertTriangle className="h-3 w-3" />
        Fair
      </Badge>
    );
  }
  
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      {condition}
    </Badge>
  );
};
