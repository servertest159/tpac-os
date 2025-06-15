import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, User, Users, Clock, Edit, Trash2, Plus, AlertCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEventDetail } from "@/hooks/useEventDetail";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

// --- Copied from EventInvite ---
import { Enums } from "@/integrations/supabase/types";
type Role = Enums<'app_role'>;

const ROLES_ORDER: Role[] = [
  'President',
  'Vice-President',
  'Honorary Secretary',
  'Honorary Assistant Secretary',
  'Honorary Treasurer',
  'Honorary Assistant Treasurer',
  'Training Head (General)',
  'Training Head (Land)',
  'Training Head (Water)',
  'Training Head (Welfare)',
  'Quartermaster',
  'Assistant Quarter Master',
  'Publicity Head',
  'First Assistant Publicity Head',
  'Second Assistant Publicity Head'
];

// -- Minimal internal version of useCrew for role lookup --
type ProfileWithRoles = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  user_roles: {
    role: Role;
  }[];
};

function useCrew() {
  const [crew, setCrew] = React.useState<ProfileWithRoles[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Get crew (profile + user_roles)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, user_roles(role)')
        .returns<ProfileWithRoles[]>();
      if (!cancelled) {
        setCrew(profiles || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return { crew, loading };
}

const EventDetailSkeleton = () => (
  <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <Card>
        <CardContent className="pt-6">
            <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
  </div>
);

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { event, loading, error, refetch } = useEventDetail(id);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Invite Crew dialog state
  const [showInviteDialog, setShowInviteDialog] = React.useState(false);
  const [selectedRoles, setSelectedRoles] = React.useState<Set<Role>>(new Set());
  const [isInviting, setIsInviting] = React.useState(false);
  const { crew, loading: loadingCrew } = useCrew();

  // See which users are already invited (from event)
  const invitedIds = React.useMemo(() =>
    event?.event_invitations.map(inv => inv.profiles?.id).filter(Boolean) as string[] ?? []
  , [event]);

  // Build roles -> members mapping
  const membersByRole = React.useMemo(() => {
    const grouped: Record<Role, ProfileWithRoles[]> = {} as Record<Role, ProfileWithRoles[]>;
    ROLES_ORDER.forEach(r => grouped[r] = []);
    if (crew) {
      crew.forEach(member => {
        member.user_roles.forEach(roleInfo => {
          if (grouped[roleInfo.role]) {
            // No duplicates
            if (!grouped[roleInfo.role].some(m => m.id === member.id)) {
              grouped[roleInfo.role].push(member);
            }
          }
        });
      });
    }
    return grouped;
  }, [crew]);

  // --- New UI for Invite Crew Dialog ---
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
    if (!id) return;
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
      event_id: id,
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
      setShowInviteDialog(false);
      setSelectedRoles(new Set());
      refetch();
    }

    setIsInviting(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast({
        title: "Failed to abort programme",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Programme Aborted",
        description: "This programme has been deleted.",
      });
      setShowDeleteDialog(false);
      navigate("/events");
    }
  };

  if (loading) {
    return <EventDetailSkeleton />;
  }

  if (error || !event) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || "Could not load event details."}</AlertDescription>
        <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
      </Alert>
    );
  }

  const status = new Date(event.date) > new Date() ? 'upcoming' : 'completed';
  const participants = event.event_invitations
    .filter(inv => inv.status === 'accepted')
    .map(inv => inv.profiles)
    .filter((p): p is NonNullable<typeof p> => p !== null);
  
  const allInvited = event.event_invitations
    .map(inv => inv.profiles)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const maxParticipants = event.max_participants || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1>{event.title}</h1>
            <Badge variant={status === "upcoming" ? "default" : "secondary"}>
              {status}
            </Badge>
          </div>
          <p className="text-muted-foreground">Programme Debrief & Coordination</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/events/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Abort Programme
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Abort Programme</DialogTitle>
                <DialogDescription>
                  Are you sure you want to abort this programme? This action cannot be undone and will be logged.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Confirm Abort
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Crew Roster</TabsTrigger>
          <TabsTrigger value="gear">Loadout</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">Programme Intel</h3>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(event.date), "p")}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {participants.length} / {maxParticipants} operators confirmed
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg">Description</h3>
                    <p className="mt-2 text-muted-foreground whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">Field Actions</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <Button asChild variant="outline">
                        <Link to={`/feedback/new?eventId=${id}`}>
                          File After-Action Report (AAR)
                        </Link>
                      </Button>
                      <Button asChild variant="secondary">
                        <Link to={`/events/${id}/gear`}>
                          Check Inventory Loadout
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
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
                        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Invite Crew by Role</DialogTitle>
                              <DialogDescription>
                                Select roles to bulk-invite all operators of those roles that haven't already been invited to this programme.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-2">
                              {ROLES_ORDER.map(role => {
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
                                onClick={() => setShowInviteDialog(false)}
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
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{participants.length}/{maxParticipants}</div>
                        <div className="text-xs text-muted-foreground">
                          {maxParticipants - participants.length} slots open
                        </div>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(participants.length / maxParticipants) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="participants" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Crew Roster ({allInvited.length})</CardTitle>
              </div>
               <p className="text-sm text-muted-foreground pt-1">
                Showing all invited operators. {participants.length} have accepted.
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
                {event.event_invitations.map((invitation) => (
                  <div key={invitation.profiles?.id} className="grid grid-cols-4 p-3 border-b last:border-0 items-center">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {invitation.profiles?.full_name}
                    </div>
                    <div>{invitation.profiles?.email}</div>
                    <div><Badge variant={invitation.status === 'accepted' ? 'default' : 'secondary'}>{invitation.status}</Badge></div>
                    <div className="text-right">
                      <Button variant="ghost" size="sm" disabled>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="gear" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Loadout Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Gear and loadout management for this programme is not yet implemented.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="itinerary" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Programme Itinerary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">A detailed itinerary for this programme has not been set up yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetail;

// NOTE: This file is >300 LOC. Please consider asking me to refactor it into smaller focused components for better maintainability.
