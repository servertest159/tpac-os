
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EventCrewInviteDialog from "./EventCrewInviteDialog";
import type { ProfileWithRoles } from "./EventCrewInviteDialog";
import { Enums } from "@/integrations/supabase/types";

type Role = Enums<"app_role">;

interface Props {
  eventId: string;
  participantsCount: number;
  maxParticipants: number;
  membersByRole: Record<Role, ProfileWithRoles[]>;
  crew: ProfileWithRoles[];
  invitedIds: string[];
  refetch: () => void;
  rolesOrder: Role[];
}

const EventCrewStatusCard: React.FC<Props> = ({
  eventId,
  participantsCount,
  maxParticipants,
  membersByRole,
  crew,
  invitedIds,
  refetch,
  rolesOrder,
}) => {
  const [showInviteDialog, setShowInviteDialog] = React.useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Crew Status
          {/* Invite Crew Button */}
          <Button
            size="icon"
            variant="outline"
            className="ml-2"
            onClick={() => setShowInviteDialog(true)}
            aria-label="Invite Crew"
          >
            <Plus className="h-4 w-4" />
          </Button>
          {/* Dialog for bulk invite */}
          <EventCrewInviteDialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            crew={crew}
            invitedIds={invitedIds}
            rolesOrder={rolesOrder}
            membersByRole={membersByRole}
            eventId={eventId}
            refetch={refetch}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {participantsCount}/{maxParticipants}
          </div>
          <div className="text-xs text-muted-foreground">
            {maxParticipants - participantsCount} slots open
          </div>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full mt-2">
          <div
            className="bg-primary h-2 rounded-full"
            style={{
              width: `${
                maxParticipants
                  ? Math.min((participantsCount / maxParticipants) * 100, 100)
                  : 0
              }%`,
            }}
          ></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCrewStatusCard;
