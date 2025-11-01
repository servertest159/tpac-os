
import React from "react";
import EventParticipantsManual from "./EventParticipantsManual";

interface EventParticipantsPanelProps {
  invitations?: any[];
  participantsCount?: number;
}

const EventParticipantsPanel = ({ invitations = [], participantsCount = 0 }: EventParticipantsPanelProps) => {
  // Convert existing invitations to manual participants format if needed
  const initialParticipants = invitations
    .filter(inv => inv.status === 'accepted' && inv.profiles)
    .map(inv => ({
      id: inv.profiles.id,
      name: inv.profiles.full_name || inv.profiles.email || 'Unknown',
      role: undefined // No role from invitations
    }));

  return (
    <div className="space-y-4">
      <EventParticipantsManual
        eventId="current-event" // This would come from props in real implementation
        maxParticipants={10}
        initialParticipants={initialParticipants}
      />
    </div>
  );
};

export default EventParticipantsPanel;
