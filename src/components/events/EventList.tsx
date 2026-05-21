import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, MapPin, Users, Clock, Trash2, Archive, ArchiveRestore, Download, FileText, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEvents, type EventWithRequirements } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { canDeleteProgrammes } from "@/lib/auth";
import { deleteProgrammes } from "@/lib/deleteProgrammes";
import { setProgrammesArchived } from "@/lib/setProgrammesArchive";
import { useToast } from "@/hooks/use-toast";
import { ScrollReveal, ScrollRevealGroup } from "@/components/ui/scroll-reveal";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, isSameMonth, isSameDay,
} from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ViewMode = "list" | "calendar";
type FilterMode = "all" | "upcoming" | "past" | "aborted" | "archived";

const EventList = () => {
  const deleteAllowed = canDeleteProgrammes();
  const { events, loading, error, refetch } = useEvents();
  const [archivedEvents, setArchivedEvents] = React.useState<EventWithRequirements[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [filter, setFilter] = React.useState<FilterMode>("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [calendarMonth, setCalendarMonth] = React.useState(new Date());
  const { toast } = useToast();

  // Fetch archived separately
  const fetchArchived = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*, event_role_requirements(quantity)")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });
    if (!error) setArchivedEvents((data as any) || []);
  }, []);

  React.useEffect(() => {
    if (filter === "archived") fetchArchived();
  }, [filter, fetchArchived]);

  React.useEffect(() => {
    const channel = supabase
      .channel("archived-events-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        if (filter === "archived") fetchArchived();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter, fetchArchived]);

  const getEventStatus = (event: EventWithRequirements) => {
    if (event.status === "aborted") return "aborted";
    const eventDay = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDay < today ? "past" : "upcoming";
  };

  const sourceEvents = filter === "archived" ? archivedEvents : events;
  const decoratedEvents = sourceEvents.map((event) => ({
    ...event,
    derivedStatus: getEventStatus(event),
    total_roles: (event.event_role_requirements || []).reduce((s, r) => s + r.quantity, 0),
  }));

  const filteredEvents = decoratedEvents.filter((event) => {
    if (filter === "all") return event.derivedStatus !== "aborted";
    if (filter === "archived") return true;
    return event.derivedStatus === filter;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(filteredEvents.map((e) => e.id)));
  const clearSelection = () => setSelected(new Set());

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteProgrammes(ids);
      toast({
        title: "Deleted",
        description: `${ids.length} programme(s) removed.`,
      });
      clearSelection();
      await refetch();
      if (filter === "archived") fetchArchived();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message ?? "Error", variant: "destructive" });
    }
  };

  const handleArchive = async (ids: string[]) => {
    try {
      await setProgrammesArchived(ids, true);
      toast({ title: "Archived", description: `${ids.length} programme(s) moved to archive.` });
      clearSelection();
      await refetch();
      await fetchArchived();
    } catch (err: any) {
      toast({ title: "Archive failed", description: err?.message ?? "Error", variant: "destructive" });
    }
  };

  const handleRestore = async (ids: string[]) => {
    try {
      await setProgrammesArchived(ids, false);
      toast({ title: "Restored", description: `${ids.length} programme(s) restored.` });
      clearSelection();
      await refetch();
      fetchArchived();
    } catch (err: any) {
      toast({ title: "Restore failed", description: err?.message ?? "Error", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const rows = filteredEvents.map((e) => ({
      Title: e.title,
      Date: format(new Date(e.date), "yyyy-MM-dd"),
      EndDate: e.end_date ? format(new Date(e.end_date), "yyyy-MM-dd") : "",
      Location: e.location ?? "",
      Status: e.derivedStatus,
      Participants: `${e.current_participants ?? 0}/${e.max_participants ?? 0}`,
      RolesNeeded: e.total_roles,
      Description: (e.description ?? "").replace(/\n/g, " "),
    }));
    if (rows.length === 0) {
      toast({ title: "Nothing to export" });
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `programmes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${rows.length} programme(s).` });
  };

  const exportPDF = () => {
    if (filteredEvents.length === 0) {
      toast({ title: "Nothing to export" });
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Programmes Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated ${format(new Date(), "PPp")} • Filter: ${filter}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Title", "Date", "Location", "Status", "Participants", "Roles"]],
      body: filteredEvents.map((e) => [
        e.title,
        format(new Date(e.date), "PP") +
          (e.end_date && !isSameDay(new Date(e.date), new Date(e.end_date))
            ? ` – ${format(new Date(e.end_date), "PP")}`
            : ""),
        e.location ?? "—",
        e.derivedStatus,
        `${e.current_participants ?? 0}/${e.max_participants ?? 0}`,
        String(e.total_roles),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 38, 38] },
    });

    doc.save(`programmes-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({ title: "PDF exported", description: `${filteredEvents.length} programme(s).` });
  };

  if (loading && filter !== "archived") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="mb-2">Error Loading Programmes</h3>
        <p className="text-muted-foreground mb-4">Could not fetch programmes.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const renderEventCard = (event: typeof filteredEvents[number]) => {
    const isArchived = filter === "archived";
    const checked = selected.has(event.id);
    return (
      <Card key={event.id} className={`card-hover hover-lift relative ${checked ? "ring-2 ring-primary" : ""}`}>
        <div className="absolute top-3 left-3 z-10">
          <Checkbox checked={checked} onCheckedChange={() => toggleSelect(event.id)} aria-label="Select programme" />
        </div>
        <CardHeader className="pl-12">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg flex-1">{event.title}</CardTitle>
            <Badge
              variant={
                event.derivedStatus === "upcoming" ? "default" :
                event.derivedStatus === "past" ? "secondary" : "destructive"
              }
            >
              {isArchived ? "Archived" :
               event.derivedStatus === "upcoming" ? "Upcoming" :
               event.derivedStatus === "past" ? "Completed" : "Aborted"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {event.description && <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" />{new Date(event.date).toLocaleDateString()}</div>
            {event.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{event.location}</div>}
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />{event.current_participants ?? 0}/{event.max_participants ?? 0} participants</div>
            {event.total_roles > 0 && <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{event.total_roles} roles needed</div>}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild className="flex-1"><Link to={`/events/${event.id}`}>View</Link></Button>
          {isArchived ? (
            <Button variant="outline" size="icon" onClick={() => handleRestore([event.id])} title="Restore">
              <ArchiveRestore className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" size="icon" onClick={() => handleArchive([event.id])} title="Archive">
              <Archive className="h-4 w-4" />
            </Button>
          )}
          {deleteAllowed && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Delete"><Trash2 className="h-4 w-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Programme</AlertDialogTitle>
                <AlertDialogDescription>Permanently remove "{event.title}"? This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete([event.id])} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}
        </CardFooter>
      </Card>
    );
  };

  // Calendar grid
  const renderCalendar = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    const days: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) { days.push(d); d = addDays(d, 1); }

    const eventsByDay = new Map<string, typeof filteredEvents>();
    filteredEvents.forEach((e) => {
      const key = format(new Date(e.date), "yyyy-MM-dd");
      const arr = eventsByDay.get(key) ?? [];
      arr.push(e);
      eventsByDay.set(key, arr);
    });

    return (
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{format(calendarMonth, "MMMM yyyy")}</h3>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCalendarMonth(new Date())}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="p-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const inMonth = isSameMonth(day, calendarMonth);
            const isToday = isSameDay(day, new Date());
            const dayEvents = eventsByDay.get(format(day, "yyyy-MM-dd")) ?? [];
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[110px] border-b border-r p-1.5 ${inMonth ? "bg-background" : "bg-muted/30 text-muted-foreground"}`}
              >
                <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary font-bold" : ""}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <Link
                      key={e.id}
                      to={`/events/${e.id}`}
                      className={`block truncate text-xs px-1.5 py-0.5 rounded ${
                        e.derivedStatus === "aborted" ? "bg-destructive/20 text-destructive" :
                        e.derivedStatus === "past" ? "bg-secondary text-secondary-foreground" :
                        "bg-primary/15 text-primary hover:bg-primary/25"
                      }`}
                      title={e.title}
                    >
                      {e.title}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 page-enter">
      <ScrollReveal variant="fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1>Programmes</h1>
            <p className="text-muted-foreground">Coordinate your field operations.</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCSV}><FileText className="h-4 w-4 mr-2" />CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF}><FileText className="h-4 w-4 mr-2" />PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild><Link to="/events/new">Plan Programme</Link></Button>
          </div>
        </div>
      </ScrollReveal>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => { setFilter(v as FilterMode); clearSelection(); }}>
          <TabsList>
            <TabsTrigger value="all">All Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Completed</TabsTrigger>
            <TabsTrigger value="aborted">Aborted</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="list"><LayoutGrid className="h-4 w-4 mr-1" />List</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-1" />Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bulk action bar */}
      {view === "list" && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
          <Checkbox
            checked={selected.size > 0 && selected.size === filteredEvents.length}
            onCheckedChange={(c) => (c ? selectAll() : clearSelection())}
            aria-label="Select all"
          />
          <span className="text-sm text-muted-foreground">
            {selected.size > 0 ? `${selected.size} selected` : `Select programmes for bulk actions`}
          </span>
          {selected.size > 0 && (
            <div className="ml-auto flex flex-wrap gap-2">
              {filter === "archived" ? (
                <Button size="sm" variant="outline" onClick={() => handleRestore(Array.from(selected))}>
                  <ArchiveRestore className="h-4 w-4 mr-1" />Restore
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => handleArchive(Array.from(selected))}>
                  <Archive className="h-4 w-4 mr-1" />Archive
                </Button>
              )}
              {deleteAllowed && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selected.size} programme(s)?</AlertDialogTitle>
                    <AlertDialogDescription>This permanently removes them and cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(Array.from(selected))} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              )}
              <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
            </div>
          )}
        </div>
      )}

      {view === "calendar" ? (
        renderCalendar()
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 px-4">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="mb-2 text-lg font-semibold">
            {filter === "archived"
              ? "No archived programmes yet"
              : filter === "aborted"
              ? "No aborted programmes"
              : filter === "past"
              ? "No completed programmes yet"
              : "No programmes yet"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {filter === "archived"
              ? "Archive a programme to keep it out of your main list without deleting it."
              : filter === "aborted"
              ? "Cancelled programmes will appear here."
              : "Plan your first field operation to start coordinating participants, roles, and gear."}
          </p>
          {filter !== "archived" && filter !== "aborted" && (
            <Button asChild size="lg">
              <Link to="/events/new">Create your first programme</Link>
            </Button>
          )}
        </div>
      ) : (
        <ScrollRevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={60}>
          {filteredEvents.map(renderEventCard)}
        </ScrollRevealGroup>
      )}
    </div>
  );
};

export default EventList;
