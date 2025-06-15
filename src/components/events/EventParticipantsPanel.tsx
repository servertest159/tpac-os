
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface ParticipantProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface EventInvitation {
  status: string;
  profiles: ParticipantProfile | null;
}

interface Props {
  invitations: EventInvitation[];
  participantsCount: number;
}

const EventParticipantsPanel: React.FC<Props> = ({
  invitations,
  participantsCount,
}) => {
  const allInvited = invitations
    .map((inv) => inv.profiles)
    .filter((p): p is ParticipantProfile => !!p);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Crew Roster ({allInvited.length})</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground pt-1">
          Showing all invited operators. {participantsCount} have accepted.
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-4 p-3 font-medium border-b">
            <div>Name</div>
            <div>Email</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          {invitations.map((invitation) => (
            <div
              key={invitation.profiles?.id}
              className="grid grid-cols-4 p-3 border-b last:border-0 items-center"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {invitation.profiles?.full_name}
              </div>
              <div>{invitation.profiles?.email}</div>
              <div>
                <Badge
                  variant={invitation.status === "accepted" ? "default" : "secondary"}
                >
                  {invitation.status}
                </Badge>
              </div>
              <div className="text-right">
                <Button variant="ghost" size="sm" disabled>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventParticipantsPanel;
