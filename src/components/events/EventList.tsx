
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEvents, type EventWithRequirements } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";

const EventList = () => {
  const { events, loading, error, refetch } = useEvents();
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "past" | "aborted">("all");

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

      {/* Filter buttons */}
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

      {filteredEvents.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="card-hover">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <Badge 
                    variant={
                      event.status === "aborted" ? "destructive" :
                      event.status === "upcoming" ? "default" : "secondary"
                    }
                  >
                    {event.status === "upcoming" ? "Upcoming" : 
                     event.status === "aborted" ? "Aborted" : "Completed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {event.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      {event.total_roles > 0
                        ? `${event.total_roles} roles required`
                        : "No roles specified"}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      {event.max_participants
                        ? `Up to ${event.max_participants} crew`
                        : "Crew size not set"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" className="w-full">
                  <Link to={`/events/${event.id}`}>
                    {event.status === "aborted" ? "View Details" : "View Debrief"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
