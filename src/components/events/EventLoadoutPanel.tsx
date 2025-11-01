
import React from "react";
import { useParams } from "react-router-dom";
import LoadoutChecker from "@/components/gear/LoadoutChecker";
import { useEventDetail } from "@/hooks/useEventDetail";
import { useGearConflicts } from "@/hooks/useGearConflicts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const EventLoadoutPanel: React.FC = () => {
  const { id } = useParams();
  const { event } = useEventDetail(id);
  const { conflicts, loading } = useGearConflicts(
    id,
    event?.date ? new Date(event.date) : undefined,
    event?.end_date ? new Date(event.end_date) : undefined
  );

  return (
    <div className="space-y-4">
      {!loading && conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Gear Availability Conflicts Detected</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              <p className="text-sm">
                The following gear items are over-allocated due to overlapping events:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {conflicts.map((conflict, idx) => (
                  <li key={idx}>
                    <strong>{conflict.gearName}</strong>: Need {conflict.quantityNeeded} total, 
                    but only {conflict.quantityAvailable} available. Conflicts with{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-destructive underline"
                      asChild
                    >
                      <Link to={`/events/${conflict.conflictingEventId}`}>
                        {conflict.conflictingEventTitle} ({conflict.conflictingEventDate})
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <LoadoutChecker />
    </div>
  );
};

export default EventLoadoutPanel;
