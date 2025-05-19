import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, User, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Sample data for demonstration purposes
const events = [
  {
    id: "1",
    title: "MacRitchie Trail Hike",
    date: "2025-05-24",
    time: "08:00 AM",
    location: "MacRitchie Reservoir Park",
    participants: 8,
    maxParticipants: 12,
    description: "Explore the TreeTop Walk and enjoy the lush greenery of Singapore's central catchment nature reserve.",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Southern Islands Kayaking",
    date: "2025-06-05",
    time: "09:30 AM",
    location: "Sentosa Island",
    participants: 6,
    maxParticipants: 10,
    description: "Paddle through the crystal clear waters around Singapore's Southern Islands and discover hidden beaches.",
    status: "upcoming",
  },
  {
    id: "3",
    title: "Night Camping at Pulau Ubin",
    date: "2025-06-15",
    time: "04:00 PM",
    location: "Pulau Ubin",
    participants: 4,
    maxParticipants: 8,
    description: "Experience a night under the stars at one of Singapore's last rural areas with authentic kampong vibes.",
    status: "upcoming",
  },
  {
    id: "4",
    title: "Climbing at Dairy Farm",
    date: "2025-04-15",
    time: "10:00 AM",
    location: "Dairy Farm Nature Park",
    participants: 12,
    maxParticipants: 12,
    description: "Scale the natural rock walls at Singapore's premier outdoor climbing spot with certified instructors.",
    status: "past",
  },
  {
    id: "5",
    title: "Rail Corridor Run",
    date: "2025-05-02",
    time: "07:00 AM",
    location: "Rail Corridor (Green Corridor)",
    participants: 20,
    maxParticipants: 30,
    description: "Join fellow runners for a morning jog along Singapore's historic and scenic Rail Corridor trail.",
    status: "past",
  },
  {
    id: "6",
    title: "Pulau Ubin Cycling Adventure",
    date: "2025-07-12",
    time: "08:30 AM",
    location: "Pulau Ubin",
    participants: 0,
    maxParticipants: 15,
    description: "Explore the rustic island of Pulau Ubin on two wheels and discover its rich biodiversity and quarries.",
    status: "upcoming",
  },
];

const EventList = () => {
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "past">("all");

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    return event.status === filter;
  });

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
                  {event.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>
                      {event.participants} / {event.maxParticipants} participants
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
