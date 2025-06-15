import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, User, Users, Clock, Edit, Trash2, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEventDetail } from "@/hooks/useEventDetail";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

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

  const handleDelete = async () => {
    if (!id) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
        toast({ title: "Error aborting programme", description: error.message, variant: "destructive" });
    } else {
        toast({
            title: "Programme Aborted",
            description: "The programme has been removed from the logs.",
        });
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
                      <Button asChild>
                        <Link to={`/events/${id}/invite`}>
                          <Plus className="mr-2 h-4 w-4" />
                          Invite Operators
                        </Link>
                      </Button>
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
                      <CardTitle className="text-base">Crew Status</CardTitle>
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
                <Button asChild size="sm">
                  <Link to={`/events/${id}/invite`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite
                  </Link>
                </Button>
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
