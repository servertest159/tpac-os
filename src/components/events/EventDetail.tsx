import React, { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, castUUID, DbEvent, DbGearEvent, castData } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EventData extends Omit<DbEvent, 'id'> {
  id: string;
}

interface GearItem {
  id: string;
  name: string;
  type: string;
  condition: string;
}

interface EventGearData {
  id: string;
  quantity: number;
  gear_id: string;
  gear: GearItem;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Fetch event details
  const { data: eventData, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', castUUID(id))
        .single();
        
      if (error) throw new Error(error.message);
      return castData<EventData>(data);
    },
    enabled: !!id
  });

  // Fetch assigned gear for this event
  const { data: gearData = [], isLoading: gearLoading } = useQuery({
    queryKey: ['event-gear', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('gear_events')
        .select(`
          id, 
          quantity, 
          gear_id, 
          gear:gear_id (name, type, condition)
        `)
        .eq('event_id', castUUID(id));
        
      if (error) throw new Error(error.message);
      
      // Explicitly cast the data to match our expected shape
      return castData<EventGearData[]>(data || []);
    },
    enabled: !!id
  });

  // Set up real-time subscription for this event
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel(`event-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${id}`
        },
        () => {
          // When event changes, refresh the data
          queryClient.invalidateQueries({ queryKey: ['event', id] });
          toast({
            title: "Event Updated",
            description: "This event has been updated in real-time."
          });
        }
      )
      .subscribe();

    // Also subscribe to gear_events changes for this event
    const gearChannel = supabase
      .channel(`event-gear-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gear_events',
          filter: `event_id=eq.${id}`
        },
        () => {
          // When gear assignments change, refresh the data
          queryClient.invalidateQueries({ queryKey: ['event-gear', id] });
          toast({
            title: "Event Gear Updated",
            description: "Equipment assigned to this event has been updated."
          });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(gearChannel);
    };
  }, [id, queryClient, toast]);

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', castUUID(id));
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted."
      });
      navigate("/events");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (eventLoading || gearLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading event details...</p>
      </div>
    );
  }

  if (eventError || !eventData) {
    return (
      <div className="text-center py-12">
        <h3 className="mb-2">Error loading event</h3>
        <p className="text-muted-foreground mb-4">
          {eventError instanceof Error ? eventError.message : "Event not found"}
        </p>
        <Button asChild>
          <Link to="/events">Back to Events</Link>
        </Button>
      </div>
    );
  }

  const event = eventData as EventData;
  const eventGear = gearData as EventGearData[];
  const isUpcoming = new Date(event.date) > new Date();
  const eventDate = new Date(event.date);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/events" className="text-sm text-muted-foreground hover:underline mb-2 inline-block">
            ← Back to Events
          </Link>
          <h1>{event.title}</h1>
        </div>
        <div className="flex space-x-2">
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
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Event</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {event.title}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>Event Details</CardTitle>
            <Badge variant={isUpcoming ? "default" : "secondary"}>
              {isUpcoming ? "Upcoming" : "Past"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>
                  {eventDate.toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>
                  {eventDate.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>{event.location || 'No location specified'}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="mr-3 h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">{event.current_participants || 0} / {event.max_participants || 0}</span>
                  <p className="text-sm text-muted-foreground">Participants</p>
                </div>
              </div>
              {isUpcoming && (
                <Button className="w-full">Join Event</Button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {event.description || "No description provided."}
            </p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Equipment</h3>
            {eventGear.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventGear.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.gear?.name}</TableCell>
                      <TableCell>{item.gear?.type}</TableCell>
                      <TableCell>{item.gear?.condition}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No equipment assigned to this event yet.</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full text-sm text-muted-foreground text-right">
            Last updated: {event.updated_at ? new Date(event.updated_at).toLocaleString() : 'N/A'}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EventDetail;
