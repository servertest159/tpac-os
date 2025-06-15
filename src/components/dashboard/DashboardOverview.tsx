
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Package, Users, MessageSquare } from "lucide-react";

// Sample data with a Singaporean twist
const stats = [
  {
    title: "Upcoming Missions",
    value: 3,
    description: "Missions in the next month",
    icon: <Calendar className="h-8 w-8 text-forest" />,
    link: "/events",
  },
  {
    title: "Gear in Armoury",
    value: 24,
    description: "Items ready for deployment",
    icon: <Package className="h-8 w-8 text-forest" />,
    link: "/gear",
  },
  {
    title: "Active Crew",
    value: 18,
    description: "Members on upcoming missions",
    icon: <Users className="h-8 w-8 text-forest" />,
    link: "/events",
  },
  {
    title: "AARs Submitted",
    value: 12,
    description: "After Action Reviews logged",
    icon: <MessageSquare className="h-8 w-8 text-forest" />,
    link: "/feedback",
  },
];

const upcomingEvents = [
  {
    id: "1",
    title: "MacRitchie Reservoir Trek",
    date: "2025-05-24",
    participants: 8,
    location: "MacRitchie Treetop Walk",
  },
  {
    id: "2",
    title: "Ubin Kayak Mangrove Tour",
    date: "2025-06-05",
    participants: 6,
    location: "Pulau Ubin",
  },
  {
    id: "3",
    title: "St. John's Island Camp",
    date: "2025-06-15",
    participants: 4,
    location: "St. John's Island",
  },
];

const DashboardOverview = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Welcome to your Dashboard</h1>
        <p className="text-muted-foreground">
          Your digital basecamp for all TPAC missions and operations.
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
          <h2 className="text-xl font-semibold">Upcoming Missions</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/events">View All Missions</Link>
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
                    {event.participants} crew
                  </span>
                  <span>{event.location}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" size="sm" className="w-full">
                  <Link to={`/events/${event.id}`}>View Debrief</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Mission Control</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button asChild className="w-full">
            <Link to="/events/new">Plan New Mission</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/gear/new">Log New Gear</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link to="/feedback/new">Start an AAR</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
