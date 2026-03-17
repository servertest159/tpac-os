import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Package, MessageSquare } from "lucide-react";
import { useGearInventory } from "@/hooks/useGearInventory";
import { useEvents } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollReveal, ScrollRevealGroup } from "@/components/ui/scroll-reveal";
import { supabase } from "@/integrations/supabase/client";

const DashboardOverview = () => {
  const { gear, loading: gearLoading } = useGearInventory();
  const { events, loading: eventsLoading } = useEvents();
  const [aarCount, setAarCount] = useState(0);

  useEffect(() => {
    const fetchAarCount = async () => {
      const { count, error } = await supabase
        .from('aar_reports')
        .select('*', { count: 'exact', head: true });
      if (!error && count !== null) setAarCount(count);
    };
    fetchAarCount();

    const channel = supabase
      .channel('aar-reports-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aar_reports' }, () => fetchAarCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loading = gearLoading || eventsLoading;

  const totalGearAvailable = gear.reduce((sum, item) => sum + item.available, 0);
  const totalGearQuantity = gear.reduce((sum, item) => sum + item.quantity, 0);

  const upcomingEventsData = events.filter(e => new Date(e.date) > new Date());
  const upcomingEventsCount = upcomingEventsData.length;
  
  const stats = [
    {
      title: "Upcoming Programmes",
      value: loading ? <Skeleton className="h-6 w-10" /> : upcomingEventsCount,
      description: "Programmes in the near future",
      icon: <Calendar className="h-8 w-8 text-forest" />,
      link: "/events",
    },
    {
      title: "Gear Ready for Deployment",
      value: loading ? <Skeleton className="h-6 w-10" /> : `${totalGearAvailable} / ${totalGearQuantity}`,
      description: "Available items out of total inventory",
      icon: <Package className="h-8 w-8 text-forest" />,
      link: "/gear",
    },
  ];
  
  const recentUpcomingEvents = upcomingEventsData.slice(0, 3);

  return (
    <div className="space-y-8 page-enter">
      <ScrollReveal variant="fade-up">
        <div>
          <h1 className="mb-2">Welcome to your Dashboard</h1>
          <p className="text-muted-foreground">
            Your digital basecamp for all TPAC missions and operations.
          </p>
        </div>
      </ScrollReveal>

      {/* Stats Overview */}
      <ScrollRevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-4" staggerDelay={100}>
        {stats.map((stat) => (
          <Card key={stat.title} className="card-hover hover-lift">
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
        
        {/* AARs Submitted Card */}
        <Card className="card-hover hover-lift md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">AARs Submitted</CardTitle>
            <MessageSquare className="h-8 w-8 text-forest" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAARs}</div>
            <p className="text-xs text-muted-foreground">After Action Reviews logged</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link to="/feedback">View Details</Link>
            </Button>
          </CardFooter>
        </Card>
      </ScrollRevealGroup>

      {/* Upcoming Events Section */}
      <ScrollReveal variant="fade-up" delay={200}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming Programmes</h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/events">View All Programmes</Link>
            </Button>
          </div>
          
          <ScrollRevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={80}>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-4/5 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : recentUpcomingEvents.map((event) => (
              <Card key={event.id} className="card-hover hover-lift">
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
          </ScrollRevealGroup>
        </div>
      </ScrollReveal>

      {/* Quick Actions */}
      <ScrollReveal variant="scale" delay={300}>
        <Card>
          <CardHeader>
            <CardTitle>Mission Control</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="w-full">
              <Link to="/events/new">Plan New Programme</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/gear/new">Log New Gear</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/feedback/new">Start an AAR</Link>
            </Button>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
};

export default DashboardOverview;
