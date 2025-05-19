
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Package, Users, MessageSquare } from "lucide-react";

// Sample data for demo purposes
const stats = [
  {
    title: "Upcoming Events",
    value: 3,
    description: "Events in the next 30 days",
    icon: <Calendar className="h-8 w-8 text-forest" />,
    link: "/events",
  },
  {
    title: "Gear Items",
    value: 24,
    description: "Items in your inventory",
    icon: <Package className="h-8 w-8 text-forest" />,
    link: "/gear",
  },
  {
    title: "Participants",
    value: 18,
    description: "People attending your events",
    icon: <Users className="h-8 w-8 text-forest" />,
    link: "/events",
  },
  {
    title: "Feedback Responses",
    value: 12,
    description: "Responses collected",
    icon: <MessageSquare className="h-8 w-8 text-forest" />,
    link: "/feedback",
  },
];

const upcomingEvents = [
  {
    id: "1",
    title: "MacRitchie Trail Hike",
    date: "2025-05-24",
    participants: 8,
    location: "MacRitchie Reservoir Park",
  },
  {
    id: "2",
    title: "Southern Islands Kayaking",
    date: "2025-06-05",
    participants: 6,
    location: "Sentosa Island",
  },
  {
    id: "3",
    title: "Night Safari Camping",
    date: "2025-06-15",
    participants: 4,
    location: "Pulau Ubin",
  },
];

const DashboardOverview = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Welcome to TPAC OS</h1>
        <p className="text-muted-foreground">
          Discover Singapore's green spaces and blue waters
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
                  <Calendar className="h-3 w-3" />
                  {new Date(event.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.participants} participants
                  </span>
                  <span>{event.location}</span>
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
            <Link to="/events/new">Plan New Activity</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/gear/new">Add Equipment</Link>
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
