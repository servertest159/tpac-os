import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEvents, type EventWithRequirements } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollReveal, ScrollRevealGroup } from "@/components/ui/scroll-reveal";

const EventList = () => {
  const { events, loading, error, refetch } = useEvents();
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "past" | "aborted">("all");
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleDelete = async (eventId: string, eventTitle: string) => {
    // Optimistic UI: hide immediately
    setDeletingIds((prev) => new Set(prev).add(eventId));
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Programme Deleted",
        description: `"${eventTitle}" has been permanently removed.`,
      });

      // Ensure UI reflects deletion right away
      await refetch();
    } catch (err) {
      // Rollback optimistic removal
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });

      console.error('Error deleting programme:', err);
      const msg = err && typeof err === 'object' && 'code' in (err as any) && (err as any).code === '23503'
        ? 'This programme has related records (e.g., itinerary, gear, or contacts). Remove them first, then try again.'
        : err instanceof Error
          ? err.message
          : 'An error occurred.';

      toast({
        title: "Failed to delete programme",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const getEventStatus = (event: EventWithRequirements) => {
    if (event.status === 'aborted') return 'aborted';
    const eventDay = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDay < today ? "past" : "upcoming";
  };

  const filteredEvents = events
    .map((event) => ({
      ...event,
      status: getEventStatus(event),
      total_roles: (event.event_role_requirements || []).reduce((sum, req) => sum + req.quantity, 0),
    }))
    .filter((event) => !deletingIds.has(event.id))
    .filter((event) => {
      if (filter === "all") return event.status !== "aborted"; // Exclude aborted from "all"
      return event.status === filter;
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Programmes</h1>
            <p className="text-muted-foreground">Coordinate your field operations.</p>
          </div>
          <Button asChild>
            <Link to="/events/new">Plan Programme</Link>
          </Button>
        </div>
        <div className="flex space-x-2 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="mb-2">Error Loading Programmes</h3>
        <p className="text-muted-foreground mb-4">Could not fetch programmes. Please try again later.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <ScrollReveal variant="fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1>Programmes</h1>
            <p className="text-muted-foreground">Coordinate your field operations.</p>
          </div>
          <Button asChild>
            <Link to="/events/new">Plan Programme</Link>
          </Button>
        </div>
      </ScrollReveal>

      {/* Filter buttons */}
      <ScrollReveal variant="fade-up" delay={100}>
        <div className="flex space-x-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Active Programmes
          </Button>
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === "past" ? "default" : "outline"}
            onClick={() => setFilter("past")}
          >
            Completed
          </Button>
          <Button
            variant={filter === "aborted" ? "default" : "outline"}
            onClick={() => setFilter("aborted")}
          >
            Aborted
          </Button>
        </div>
      </ScrollReveal>

      {filteredEvents.length === 0 ? (
        <ScrollReveal variant="fade-up">
          <div className="text-center py-12">
            <h3 className="mb-2">No Programmes Found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === "aborted" 
                ? "No aborted programmes found." 
                : "There are no programmes matching your filters. Time to plan one?"
              }
            </p>
            {filter !== "aborted" && (
              <Button asChild>
                <Link to="/events/new">Plan a Programme</Link>
              </Button>
            )}
          </div>
        </ScrollReveal>
      ) : (
        <ScrollRevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={80}>
          {filteredEvents.map((event) => (
            <Card key={event.id} className="card-hover hover-lift">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg flex-1">{event.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        event.status === "upcoming" ? "default" : 
                        event.status === "past" ? "secondary" : 
                        "destructive"
                      }
                    >
                      {event.status === "upcoming" ? "Upcoming" : 
                       event.status === "past" ? "Completed" : 
                       "Aborted"}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Programme</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{event.title}"? This will permanently remove the programme and all related data. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(event.id, event.title)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                    {event.end_date && new Date(event.date).toDateString() !== new Date(event.end_date).toDateString() && (
                      <span>- {new Date(event.end_date).toLocaleDateString()}</span>
                    )}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{event.current_participants || 0}/{event.max_participants || 0} participants</span>
                  </div>
                  {event.total_roles > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{event.total_roles} roles needed</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={`/events/${event.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </ScrollRevealGroup>
      )}
    </div>
  );
};

export default EventList;
