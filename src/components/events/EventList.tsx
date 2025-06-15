
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
    title: "MacRitchie Reservoir Trek",
    date: "2025-05-24",
    time: "08:00 AM",
    location: "MacRitchie Reservoir",
    participants: 8,
    maxParticipants: 12,
    description: "A trek through the scenic trails of MacRitchie, including the Treetop Walk.",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Ubin Kayak Mangrove Tour",
    date: "2025-06-05",
    time: "09:30 AM",
    location: "Pulau Ubin",
    participants: 6,
    maxParticipants: 10,
    description: "Explore the rich biodiversity of the mangroves around Pulau Ubin by kayak.",
    status: "upcoming",
  },
  {
    id: "3",
    title: "St. John's Island Camp",
    date: "2025-06-15",
    time: "04:00 PM",
    location: "St. John's Island",
    participants: 4,
    maxParticipants: 8,
    description: "Overnight camping trip to St. John's, focusing on coastal navigation and survival skills.",
    status: "upcoming",
  },
  {
    id: "4",
    title: "Dairy Farm Quarry Climb",
    date: "2025-04-15",
    time: "10:00 AM",
    location: "Dairy Farm Nature Park",
    participants: 12,
    maxParticipants: 12,
    description: "Rock climbing and abseiling practice at the Dairy Farm quarry.",
    status: "past",
  },
  {
    id: "5",
    title: "Green Corridor Run",
    date: "2025-05-02",
    time: "07:00 AM",
    location: "Rail Corridor (Central)",
    participants: 20,
    maxParticipants: 30,
    description: "A trail run along the historic Rail Corridor, exploring Singapore's green spine.",
    status: "past",
  },
  {
    id: "6",
    title: "Ketam Mountain Biking",
    date: "2025-07-12",
    time: "08:30 AM",
    location: "Ketam Bike Park, Ubin",
    participants: 0,
    maxParticipants: 15,
    description: "Tackle the blue and black diamond trails at Ketam Mountain Bike Park on Pulau Ubin.",
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
          <h1>Missions</h1>
          <p className="text-muted-foreground">Coordinate your field operations.</p>
        </div>
        <Button asChild>
          <Link to="/events/new">Plan Mission</Link>
        </Button>
      </div>

      {/* Filter buttons */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Missions
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
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="mb-2">No Missions Found</h3>
          <p className="text-muted-foreground mb-4">There are no missions matching your filters. Time to plan one?</p>
          <Button asChild>
            <Link to="/events/new">Plan a Mission</Link>
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
                    {event.status === "upcoming" ? "Upcoming" : "Completed"}
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
                    <span>{new Date(event.date).toLocaleDateDateString()}</span>
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
                      {event.participants} / {event.maxParticipants} crew
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" className="w-full">
                  <Link to={`/events/${event.id}`}>View Debrief</Link>
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
