import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface EventFormProps {
  eventId?: string;
}

const EventForm: React.FC<EventFormProps> = ({ eventId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!eventId;
  
  // Sample event data for editing (in a real app, would fetch from API)
  const eventData = isEditing
    ? {
        title: "MacRitchie Trail Hike",
        date: "2025-05-24",
        time: "08:00",
        location: "MacRitchie Reservoir Park",
        description: "A half-day hiking trip through the beautiful MacRitchie trails with a visit to the famous TreeTop Walk.",
        maxParticipants: 12,
      }
    : {
        title: "",
        date: "",
        time: "",
        location: "",
        description: "",
        maxParticipants: 10,
      };

  const [formData, setFormData] = React.useState(eventData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: isEditing ? "Event Updated" : "Event Created",
        description: `Successfully ${isEditing ? "updated" : "created"} ${formData.title}`,
      });
      navigate("/events");
    }, 500);
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
          <Button type="submit">
            {isEditing ? "Update Event" : "Create Event"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EventForm;
