
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const EventItineraryPanel: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Programme Itinerary</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        A detailed itinerary for this programme has not been set up yet.
      </p>
    </CardContent>
  </Card>
);

export default EventItineraryPanel;
