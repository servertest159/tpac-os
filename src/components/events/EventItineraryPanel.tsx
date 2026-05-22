import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

export interface EventItineraryPanelProps {
  items: Tables<"itinerary_items">[];
}

const EventItineraryPanel: React.FC<EventItineraryPanelProps> = ({ items }) => {
  const sorted = React.useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return (a.time || "").localeCompare(b.time || "");
      }),
    [items],
  );

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Programme Itinerary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No itinerary steps yet. Edit the programme to add day-by-day activities, times, and locations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Programme Itinerary</CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          Planned schedule (from programme planning). Use Day for multi-day programmes.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Day</TableHead>
                <TableHead className="w-28">Time</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Location / notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.day}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {row.time?.trim() || "—"}
                  </TableCell>
                  <TableCell>{row.activity || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.location?.trim() || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventItineraryPanel;
