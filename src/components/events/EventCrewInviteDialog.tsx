
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Enums } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Role = Enums<"app_role">;
export type ProfileWithRoles = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  user_roles: { role: Role }[];
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  crew: ProfileWithRoles[];
  invitedIds: string[];
  rolesOrder: Role[];
  membersByRole: Record<Role, ProfileWithRoles[]>;
  eventId: string;
  refetch: () => void;
}

const EventCrewInviteDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  crew,
  invitedIds,
  rolesOrder,
  membersByRole,
  eventId,
  refetch
}) => {
  const { toast } = useToast();
  const [selectedRoles, setSelectedRoles] = React.useState<Set<Role>>(new Set());
  const [isInviting, setIsInviting] = React.useState(false);

  const handleRoleToggle = (role: Role) => {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role)
      } else {
        next.add(role)
      }
      return next;
    });
  };

  const handleInviteCrew = async () => {
    if (!eventId) return;
    setIsInviting(true);

    // Gather all member ids from selected roles and not already invited
    const memberIdsToInvite = new Set<string>();
    selectedRoles.forEach(role => {
      const members = membersByRole[role] || [];
      members.forEach(member => {
        if (!invitedIds.includes(member.id)) {
          memberIdsToInvite.add(member.id);
        }
      });
    });

    if (memberIdsToInvite.size === 0) {
      toast({
        title: "No new operators to invite",
        description: "All operators for the selected roles are already invited or there are none.",
      });
      setIsInviting(false);
      return;
    }

    const invites = Array.from(memberIdsToInvite).map(userId => ({
      event_id: eventId,
      user_id: userId,
      status: 'pending' as const
    }));

    const { error: insertError } = await supabase.from('event_invitations').insert(invites);

    if (insertError) {
      toast({
        title: "❌ Invitation Failed",
        description: "An error occurred during bulk invitation. Some users may already have been invited.",
        variant: "destructive",
      });
    } else {
      toast({
        title: `✅ ${invites.length} Operator(s) Invited`,
        description: "Successfully sent invitations.",
      });
      onOpenChange(false);
      setSelectedRoles(new Set());
      refetch();
    }

    setIsInviting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Crew by Role</DialogTitle>
          <DialogDescription>
            Select roles to bulk-invite all operators of those roles that haven't already been invited to this programme.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {rolesOrder.map(role => {
            const availableCount = (membersByRole[role] || []).filter(m => !invitedIds.includes(m.id)).length;
            const displayCount = availableCount === 0 ? 1 : availableCount;
            return (
              <label
                key={role}
                className="flex items-center gap-2 text-sm font-medium cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.has(role)}
                  onChange={() => handleRoleToggle(role)}
                  className="h-4 w-4"
                />
                {role}
                <span className="text-muted-foreground ml-1 text-xs">
                  ({displayCount} available to invite)
                </span>
              </label>
            );
          })}
          {Array.from(selectedRoles).length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {Array.from(selectedRoles).length} role(s) selected.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleInviteCrew}
            disabled={selectedRoles.size === 0 || isInviting}
          >
            {isInviting ? "Inviting..." : "Invite Selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventCrewInviteDialog;
