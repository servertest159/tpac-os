
import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, Edit, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEventDetail } from "@/hooks/useEventDetail";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import EventParticipantsPanel from "./EventParticipantsPanel";
import EventLoadoutPanel from "./EventLoadoutPanel";
import EventItineraryPanel from "./EventItineraryPanel";
import { Card, CardContent } from "@/components/ui/card";

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

  const handleAbort = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Programme Deleted",
        description: "The programme and all related data have been permanently removed.",
      });
      setShowDeleteDialog(false);
      navigate('/events');
    } catch (err) {
      console.error('Error deleting programme:', err);
      const msg = err && typeof err === 'object' && 'code' in (err as any) && (err as any).code === '23503'
        ? 'This programme has related records (e.g., itinerary items, gear assignments, or emergency contacts). Remove them first, then try again.'
        : err instanceof Error
          ? err.message
          : 'An error occurred while deleting the programme.';
      toast({
        title: "Failed to delete programme",
        description: msg,
        variant: "destructive",
      });
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
  
  const maxParticipants = event.max_participants || 0;

  const getStatusBadge = () => {
    return (
      <Badge variant={status === "upcoming" ? "default" : "secondary"}>
        {status === "upcoming" ? "Upcoming" : "Completed"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1>{event.title}</h1>
            {getStatusBadge()}
          </div>
          <p className="text-muted-foreground">
            Programme Debrief & Coordination
          </p>
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
                  Delete Programme
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Programme</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this programme? This will permanently remove the programme and all related data (participants, loadout, itinerary). This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleAbort}>
                    Confirm Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
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
                          {participants.length} / {maxParticipants} participants confirmed
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="participants" className="space-y-4 pt-4">
          <EventParticipantsPanel
            invitations={event.event_invitations}
            participantsCount={participants.length}
          />
        </TabsContent>
        
        <TabsContent value="gear" className="space-y-4 pt-4">
          <EventLoadoutPanel />
        </TabsContent>
        
        <TabsContent value="itinerary" className="space-y-4 pt-4">
          <EventItineraryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetail;
