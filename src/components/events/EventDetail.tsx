
import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, User, Users, Clock, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Sample event data (in a real app this would come from an API)
const eventData = {
  id: "1",
  title: "MacRitchie Trail Hike",
  date: "2025-05-24",
  time: "08:00 AM",
  location: "MacRitchie Reservoir Park, Venus Drive Entrance",
  participants: [
    { id: "1", name: "John Tan", email: "john@example.com" },
    { id: "2", name: "Jane Lim", email: "jane@example.com" },
    { id: "3", name: "Michael Ng", email: "mike@example.com" },
    { id: "4", name: "Sarah Wong", email: "sarah@example.com" },
    { id: "5", name: "Thomas Loh", email: "tom@example.com" },
    { id: "6", name: "Lisa Chan", email: "lisa@example.com" },
    { id: "7", name: "David Goh", email: "david@example.com" },
    { id: "8", name: "Emma Tay", email: "emma@example.com" },
  ],
  maxParticipants: 12,
  description: "A half-day hiking trip through the beautiful MacRitchie trails with a visit to the famous TreeTop Walk. We'll cover approximately 7km of trail through primary and secondary rainforest. Suitable for beginner hikers with moderate fitness levels. Remember to bring mosquito repellent and plenty of water as Singapore's humidity can be challenging.",
  status: "upcoming",
  itinerary: [
    { day: "Morning", activities: "Meet at Venus Drive entrance (8:00 AM), Hike to TreeTop Walk (3km), Rest and take photos at the suspension bridge, Continue to Jelutong Tower for panoramic views" },
    { day: "Afternoon", activities: "Lunch at Mushroom Cafe, Hike around the reservoir (2km), Visit the HSBC TreeTop Walk, Return to starting point (2km), Departure (approx 2:00 PM)" },
  ],
  gearRequired: [
    "Comfortable walking shoes", "Water bottle (1L minimum)", "Mosquito repellent", "Sunscreen", "Lightweight breathable clothing", "Small backpack", "Rain poncho (just in case)"
  ],
  gearProvided: [
    "Trail maps", "First aid kit", "Electrolyte drinks", "Light snacks"
  ],
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleDelete = () => {
    // Simulate API call to delete
    setTimeout(() => {
      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
      });
      navigate("/events");
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1>{eventData.title}</h1>
            <Badge variant={eventData.status === "upcoming" ? "default" : "secondary"}>
              {eventData.status === "upcoming" ? "Upcoming" : "Past"}
            </Badge>
          </div>
          <p className="text-muted-foreground">Event details and management</p>
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
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Event</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this event? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Event
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
          <TabsTrigger value="gear">Gear</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">Event Details</h3>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{new Date(eventData.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{eventData.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{eventData.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {eventData.participants.length} / {eventData.maxParticipants} participants
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg">Description</h3>
                    <p className="mt-2 text-muted-foreground whitespace-pre-line">
                      {eventData.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">Quick Actions</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <Button asChild>
                        <Link to={`/events/${eventData.id}/invite`}>
                          <Plus className="mr-2 h-4 w-4" />
                          Invite Participants
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to={`/feedback/new?eventId=${eventData.id}`}>
                          Create Feedback Form
                        </Link>
                      </Button>
                      <Button asChild variant="secondary">
                        <Link to={`/events/${eventData.id}/gear`}>
                          Manage Event Gear
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Participant Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{eventData.participants.length}/{eventData.maxParticipants}</div>
                        <div className="text-xs text-muted-foreground">
                          {eventData.maxParticipants - eventData.participants.length} spots remaining
                        </div>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(eventData.participants.length / eventData.maxParticipants) * 100}%` }}
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
                <CardTitle>Participants ({eventData.participants.length})</CardTitle>
                <Button asChild size="sm">
                  <Link to={`/events/${id}/invite`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-3 p-3 font-medium border-b">
                  <div>Name</div>
                  <div>Email</div>
                  <div className="text-right">Actions</div>
                </div>
                {eventData.participants.map((participant) => (
                  <div key={participant.id} className="grid grid-cols-3 p-3 border-b last:border-0 items-center">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {participant.name}
                    </div>
                    <div>{participant.email}</div>
                    <div className="text-right">
                      <Button variant="ghost" size="sm">Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="gear" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Required Gear</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {eventData.gearRequired.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Provided Gear</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {eventData.gearProvided.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-secondary"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <Button asChild>
            <Link to={`/events/${id}/gear`}>
              Manage Event Gear
            </Link>
          </Button>
        </TabsContent>
        
        <TabsContent value="itinerary" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Itinerary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {eventData.itinerary.map((item, index) => (
                  <div key={index}>
                    <h3 className="font-medium text-lg mb-2">{item.day}</h3>
                    <p className="whitespace-pre-line text-muted-foreground">{item.activities}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetail;
