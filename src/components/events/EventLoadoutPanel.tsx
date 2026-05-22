
import React from "react";
import { useParams } from "react-router-dom";
import LoadoutChecker from "@/components/gear/LoadoutChecker";
import { useGearConflicts } from "@/hooks/useGearConflicts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface EventLoadoutPanelProps {
  /** Programme start datetime (ISO) from loaded event — avoids double-fetch via useEventDetail */
  eventDateISO: string;
  eventEndDateISO?: string | null;
}

const ConflictSkeleton: React.FC = () => (
  <div className="space-y-3 rounded-lg border bg-card p-4" aria-busy="true">
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-full max-w-xs" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-2/3" />
    <span className="sr-only">Checking gear availability…</span>
  </div>
);

const EventLoadoutPanel: React.FC<EventLoadoutPanelProps> = ({ eventDateISO, eventEndDateISO }) => {
  const { id } = useParams();
  const eventDate = React.useMemo(() => new Date(eventDateISO), [eventDateISO]);
  const eventEndDate = React.useMemo(
    () => (eventEndDateISO ? new Date(eventEndDateISO) : undefined),
    [eventEndDateISO],
  );
  const { conflicts, loading } = useGearConflicts(id, eventDate, eventEndDate);

  return (
    <div className="space-y-4">
      {loading ? (
        <ConflictSkeleton />
      ) : conflicts.length > 0 ? (
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
      ) : null}
      <LoadoutChecker />
    </div>
  );
};

export default EventLoadoutPanel;
