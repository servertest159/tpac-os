
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, castUUID } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";

interface EventFormProps {
  eventId?: string;
}

interface EventFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  maxParticipants: number;
}

interface EventData {
  id: string;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
  max_participants: number | null;
}

// Type for Supabase event insert
type EventInsert = Database['public']['Tables']['events']['Insert'];
// Type for Supabase event update
type EventUpdate = Database['public']['Tables']['events']['Update'];

const EventForm: React.FC<EventFormProps> = ({ eventId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!eventId;
  
  const defaultFormData: EventFormData = {
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    maxParticipants: 10,
  };
  
  const [formData, setFormData] = useState<EventFormData>(defaultFormData);

  // Fetch event data if editing
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', castUUID(eventId))
        .single();
        
      if (error) throw new Error(error.message);
      return data as EventData;
    },
    enabled: !!eventId
  });

  // Update form data when event data is loaded
  useEffect(() => {
    if (eventData) {
      const eventDate = new Date(eventData.date);
      setFormData({
        title: eventData.title,
        date: eventDate.toISOString().split('T')[0],
        time: eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        location: eventData.location || "",
        description: eventData.description || "",
        maxParticipants: eventData.max_participants || 10,
      });
    }
  }, [eventData]);

  // Create/update event mutation
  const eventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      // Combine date and time
      const dateTime = new Date(`${data.date}T${data.time}`);
      
      // Prepare data matching Supabase schema
      const eventData: EventInsert = {
        title: data.title,
        date: dateTime.toISOString(),
        location: data.location,
        description: data.description,
        max_participants: data.maxParticipants,
      };
      
      if (isEditing && eventId) {
        const { error } = await supabase
          .from('events')
          .update(eventData as EventUpdate)
          .eq('id', castUUID(eventId));
          
        if (error) throw error;
        return { id: eventId };
      } else {
        const { data: newEvent, error } = await supabase
          .from('events')
          .insert(eventData)
          .select();
          
        if (error) throw error;
        return newEvent[0];
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Event Updated" : "Event Created",
        description: `Successfully ${isEditing ? "updated" : "created"} ${formData.title}`,
      });
      navigate("/events");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    eventMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate("/events");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading event data...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Event" : "Create New Event"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter event name (e.g. Southern Ridges Hike)"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location (e.g. East Coast Park)"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your event including meeting points, difficulty level, and what participants should expect"
              rows={4}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Maximum Participants</Label>
            <Input
              id="maxParticipants"
              name="maxParticipants"
              type="number"
              value={formData.maxParticipants}
              onChange={handleChange}
              min={1}
              required
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={eventMutation.isPending}>
            {eventMutation.isPending 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update Event" : "Create Event")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EventForm;
