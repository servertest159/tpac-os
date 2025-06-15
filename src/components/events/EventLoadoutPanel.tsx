
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const EventLoadoutPanel: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Loadout Management</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Gear and loadout management for this programme is not yet implemented.
      </p>
    </CardContent>
  </Card>
);

export default EventLoadoutPanel;
