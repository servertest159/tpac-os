
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase, DbEvent } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

interface Event extends DbEvent {
  status?: 'upcoming' | 'past';
}

const EventList = () => {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch events from Supabase
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw new Error(error.message);

      // Cast the data to our Event type and add status property
      const typedData = data as DbEvent[];
      return typedData.map((event) => ({
        ...event,
        status: new Date(event.date) > new Date() ? 'upcoming' : 'past'
      } as Event));
    }
  });

  // Set up real-time subscription for events updates
  useEffect(() => {
    const channel = supabase
      .channel('public:events')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'events'
        },
        () => {
          // When any event changes, refresh the data
          queryClient.invalidateQueries({ queryKey: ['events'] });
          toast({
            title: "Events Updated",
            description: "The events list has been updated in real-time."
          });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    return event.status === filter;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="mb-2">Error loading events</h3>
        <p className="text-muted-foreground mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['events'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Events</h1>
          <p className="text-muted-foreground">Discover Singapore's outdoor activities</p>
        </div>
        <Button asChild>
          <Link to="/events/new">Create Event</Link>
        </Button>
      </div>

      {/* Filter buttons */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Events
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
          Past
        </Button>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">There are no events matching your filter criteria.</p>
          <Button asChild>
            <Link to="/events/new">Create an Event</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="card-hover">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <Badge variant={event.status === "upcoming" ? "default" : "secondary"}>
                    {event.status === "upcoming" ? "Upcoming" : "Past"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {event.description || "No description available"}
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
                    <span>{event.location || "No location specified"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      {event.current_participants || 0} / {event.max_participants || 0} participants
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" className="w-full">
                  <Link to={`/events/${event.id}`}>View Details</Link>
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
