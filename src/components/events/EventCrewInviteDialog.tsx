
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

  // State: How many operators to invite per role
  const [roleCounts, setRoleCounts] = React.useState<Record<Role, number>>({} as Record<Role, number>);
  const [isInviting, setIsInviting] = React.useState(false);

  React.useEffect(() => {
    // Reset counts on dialog open
    if (open) {
      const initial: Record<Role, number> = {} as Record<Role, number>;
      rolesOrder.forEach(role => initial[role] = 0);
      setRoleCounts(initial);
    }
  }, [open, rolesOrder]);

  // Available per role = not yet invited
  const availablePerRole: Record<Role, ProfileWithRoles[]> = React.useMemo(() => {
    const result: Record<Role, ProfileWithRoles[]> = {} as Record<Role, ProfileWithRoles[]>;
    rolesOrder.forEach(role => {
      result[role] = (membersByRole[role] || []).filter((m) => !invitedIds.includes(m.id));
    });
    return result;
  }, [rolesOrder, membersByRole, invitedIds]);

  // Helper to adjust count safely
  const setRoleCount = (role: Role, count: number) => {
    setRoleCounts(prev => ({
      ...prev,
      [role]: Math.max(0, Math.min(count, availablePerRole[role]?.length ?? 0))
    }));
  };

  const handleInviteCrew = async () => {
    if (!eventId) return;
    setIsInviting(true);

    // Collect all desired invites per role in one array
    const invites: {event_id: string, user_id: string, status: "pending"}[] = [];
    rolesOrder.forEach(role => {
      const selected = roleCounts[role] || 0;
      const available = availablePerRole[role] || [];
      for (let i = 0; i < selected; i++) {
        if (available[i]) {
          invites.push({
            event_id: eventId,
            user_id: available[i].id,
            status: "pending"
          });
        }
      }
    });

    if (!invites.length) {
      toast({
        title: "No new operators to invite",
        description: "You have not selected any roles/operators.",
      });
      setIsInviting(false);
      return;
    }

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
            For each role, select the number of available operators to invite to this programme.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
          {rolesOrder.map(role => {
            const available = availablePerRole[role] || [];
            const selected = roleCounts[role] || 0;
            return (
              <div key={role} className="flex items-center gap-3 text-sm">
                <span className="w-48">{role}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="px-2 py-0.5 bg-secondary rounded border border-input text-lg font-bold disabled:opacity-50"
                    disabled={selected <= 0}
                    onClick={() => setRoleCount(role, selected - 1)}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={available.length}
                    value={selected}
                    onChange={e => setRoleCount(role, Number(e.target.value))}
                    className="w-12 text-center border rounded bg-background"
                  />
                  <button
                    type="button"
                    className="px-2 py-0.5 bg-secondary rounded border border-input text-lg font-bold disabled:opacity-50"
                    disabled={selected >= available.length}
                    onClick={() => setRoleCount(role, selected + 1)}
                  >
                    +
                  </button>
                </div>
                <span className="text-muted-foreground text-xs ml-2">
                  ({available.length} available)
                </span>
              </div>
            );
          })}
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
            disabled={
              isInviting ||
              Object.values(roleCounts).every((v) => !v)
            }
          >
            {isInviting ? "Inviting..." : "Invite Selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventCrewInviteDialog;
