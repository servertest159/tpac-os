
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, Backpack, Users, ClipboardList, MapPin } from "lucide-react";

// Sample data for demo purposes
const stats = [
  {
    title: "Upcoming Events",
    value: 3,
    description: "Events in the next 30 days",
    icon: <Map className="h-8 w-8 text-primary" />,
    link: "/events",
  },
  {
    title: "Gear Inventory",
    value: 24,
    description: "Items ready for the field",
    icon: <Backpack className="h-8 w-8 text-primary" />,
    link: "/gear",
  },
  {
    title: "Active Participants",
    value: 18,
    description: "Members on upcoming trips",
    icon: <Users className="h-8 w-8 text-primary" />,
    link: "/events",
  },
  {
    title: "Feedback Reports",
    value: 12,
    description: "AARs submitted",
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    link: "/feedback",
  },
];

const upcomingEvents = [
  {
    id: "1",
    title: "Mountain Hiking Weekend",
    date: "2025-05-24",
    participants: 8,
    location: "Blue Ridge Mountains",
  },
  {
    id: "2",
    title: "Kayaking Trip",
    date: "2025-06-05",
    participants: 6,
    location: "Lake Superior",
  },
  {
    id: "3",
    title: "Camping Under Stars",
    date: "2025-06-15",
    participants: 4,
    location: "Yellowstone National Park",
  },
];

const DashboardOverview = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Your Digital Basecamp</h1>
        <p className="text-muted-foreground">
          Plan, execute, and reflect on your Singapore adventures.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link to={stat.link}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Upcoming Events Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/events">View All Events</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Map className="h-3 w-3" />
                  {new Date(event.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.participants} participants
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" size="sm" className="w-full">
                  <Link to={`/events/${event.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button asChild className="w-full">
            <Link to="/events/new">Create New Event</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/gear/new">Add Gear Item</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link to="/feedback/new">Create Feedback Form</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
