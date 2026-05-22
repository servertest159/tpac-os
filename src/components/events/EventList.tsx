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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { canDeleteProgrammes, canStaffManage } from "@/lib/auth";
import { deleteProgrammes } from "@/lib/deleteProgrammes";
import { setProgrammesArchived } from "@/lib/setProgrammesArchive";
import { useToast } from "@/hooks/use-toast";
import { ScrollReveal, ScrollRevealGroup } from "@/components/ui/scroll-reveal";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, isSameMonth, isSameDay, eachDayOfInterval, startOfDay,
} from "date-fns";
import { foreignKeyViolationMessage } from "@/lib/dbErrors";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ViewMode = "list" | "calendar";
type FilterMode = "all" | "upcoming" | "past" | "aborted" | "archived";

const EventList = () => {
  const deleteAllowed = canDeleteProgrammes();
  const staffManage = canStaffManage();
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
      const { deletedCount, failed } = await deleteProgrammes(ids);

      const failedIds = new Set(failed.map((f) => f.id));
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => {
          if (!failedIds.has(id)) next.delete(id);
        });
        return next;
      });

      await refetch();
      if (filter === "archived") fetchArchived();

      const failN = failed.length;
      const hint = failN > 0 ? foreignKeyViolationMessage(new Error(failed[0].message)) ?? failed[0].message : "";

      if (failN === 0) {
        toast({
          title: "Deleted",
          description: `${deletedCount} programme(s) removed.`,
        });
      } else if (deletedCount > 0) {
        toast({
          variant: "destructive",
          title: "Partially deleted",
          description: `${deletedCount} removed, ${failN} failed. ${hint}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: hint || `${failN} programme(s) could not be deleted.`,
        });
      }
    } catch (err: unknown) {
      const fk = foreignKeyViolationMessage(err);
      toast({
        title: "Delete failed",
        description: fk ?? (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (ids: string[]) => {
    try {
      const { updatedCount, failed } = await setProgrammesArchived(ids, true);

      const failedIds = new Set(failed.map((f) => f.id));
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => {
          if (!failedIds.has(id)) next.delete(id);
        });
        return next;
      });

      await refetch();
      await fetchArchived();

      const failN = failed.length;
      const hint = failN > 0 ? foreignKeyViolationMessage(new Error(failed[0].message)) ?? failed[0].message : "";

      if (failN === 0) {
        toast({ title: "Archived", description: `${updatedCount} programme(s) moved to archive.` });
      } else if (updatedCount > 0) {
        toast({
          variant: "destructive",
          title: "Partially archived",
          description: `${updatedCount} archived, ${failN} failed. ${hint}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Archive failed",
          description: hint || `${failN} programme(s) could not be archived.`,
        });
      }
    } catch (err: unknown) {
      const fk = foreignKeyViolationMessage(err);
      toast({
        title: "Archive failed",
        description: fk ?? (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (ids: string[]) => {
    try {
      const { updatedCount, failed } = await setProgrammesArchived(ids, false);

      const failedIds = new Set(failed.map((f) => f.id));
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => {
          if (!failedIds.has(id)) next.delete(id);
        });
        return next;
      });

      await refetch();
      fetchArchived();

      const failN = failed.length;
      const hint = failN > 0 ? foreignKeyViolationMessage(new Error(failed[0].message)) ?? failed[0].message : "";

      if (failN === 0) {
        toast({ title: "Restored", description: `${updatedCount} programme(s) restored.` });
      } else if (updatedCount > 0) {
        toast({
          variant: "destructive",
          title: "Partially restored",
          description: `${updatedCount} restored, ${failN} failed. ${hint}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Restore failed",
          description: hint || `${failN} programme(s) could not be restored.`,
        });
      }
    } catch (err: unknown) {
      const fk = foreignKeyViolationMessage(err);
      toast({
        title: "Restore failed",
        description: fk ?? (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      });
    }
  };

  type ProgrammeExportSource = (typeof filteredEvents)[number];

  /** CSV/PDF Status column mirrors card badges where possible */
  function archivedOrDerivedStatus(e: ProgrammeExportSource): string {
    const row = e as EventWithRequirements;
    if (row.archived_at != null && String(row.archived_at).length > 0) return "archived";
    return e.derivedStatus;
  }

  const buildCsvRecords = (list: ProgrammeExportSource[]) =>
    list.map((e) => ({
      Title: e.title,
      Date: format(new Date(e.date), "yyyy-MM-dd"),
      EndDate: e.end_date ? format(new Date(e.end_date), "yyyy-MM-dd") : "",
      Location: e.location ?? "",
      Status: archivedOrDerivedStatus(e),
      Participants: `${e.current_participants ?? 0}/${e.max_participants ?? 0}`,
      RolesNeeded: e.total_roles,
      Description: (e.description ?? "").replace(/\n/g, " "),
    }));

  const downloadProgrammesCsv = (list: ProgrammeExportSource[], fileSlug: string) => {
    const rows = buildCsvRecords(list);
    if (rows.length === 0) {
      toast({ title: "Nothing to export", description: "Pick programmes or choose programmes in this tab." });
      return false;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String((r as Record<string, unknown>)[h]).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileSlug}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${rows.length} programme(s).` });
    return true;
  };

  const downloadProgrammesPdf = (
    list: ProgrammeExportSource[],
    summaryLine: string,
    fileSlug: string,
  ) => {
    if (list.length === 0) {
      toast({ title: "Nothing to export", description: "Pick programmes or choose programmes in this tab." });
      return false;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Programmes report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated ${format(new Date(), "PPp")} • ${summaryLine}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Title", "Date", "Location", "Status", "Participants", "Roles"]],
      body: list.map((e) => [
        e.title,
        format(new Date(e.date), "PP") +
          (e.end_date && !isSameDay(new Date(e.date), new Date(e.end_date))
            ? ` – ${format(new Date(e.end_date), "PP")}`
            : ""),
        e.location ?? "—",
        archivedOrDerivedStatus(e),
        `${e.current_participants ?? 0}/${e.max_participants ?? 0}`,
        String(e.total_roles),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 38, 38] },
    });

    doc.save(`${fileSlug}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({ title: "PDF exported", description: `${list.length} programme(s).` });
    return true;
  };

  const exportFilteredCsv = () => {
    downloadProgrammesCsv(filteredEvents, `programmes-tab-${filter}`);
  };

  const exportFilteredPdf = () => {
    downloadProgrammesPdf(
      filteredEvents,
      `Full tab (${filter}); ${filteredEvents.length} programme(s)`,
      `programmes-tab-${filter}`,
    );
  };

  const selectedExportList = () => filteredEvents.filter((e) => selected.has(e.id));

  const exportSelectedCsv = () => {
    if (selected.size === 0) {
      toast({ title: "No selection", description: "Tick programmes in List view first." });
      return;
    }
    const list = selectedExportList();
    if (list.length === 0) {
      toast({
        title: "Selection not in this tab",
        description: "Switch back to the tab where those programmes are listed, or clear and re‑select.",
      });
      return;
    }
    downloadProgrammesCsv(list, `programmes-selected-${list.length}`);
  };

  const exportSelectedPdf = () => {
    if (selected.size === 0) {
      toast({ title: "No selection", description: "Tick programmes in List view first." });
      return;
    }
    const list = selectedExportList();
    if (list.length === 0) {
      toast({
        title: "Selection not in this tab",
        description: "Switch back to the tab where those programmes are listed, or clear and re‑select.",
      });
      return;
    }
    downloadProgrammesPdf(list, `Selected ${list.length} programme(s)`, `programmes-selected-${list.length}`);
  };

  /** Export picker used in toolbar (calendar) when user has leftovers from List */
  const renderExportSelectionDropdown = (triggerClassName?: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={triggerClassName}
          disabled={selected.size === 0}
        >
          <Download className="h-4 w-4 mr-1 shrink-0" />
          Selected ({selected.size})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Exports ticked programmes ({selected.size}) in this tab.
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={exportSelectedCsv} disabled={selected.size === 0}>
          <FileText className="h-4 w-4 mr-2" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportSelectedPdf} disabled={selected.size === 0}>
          <FileText className="h-4 w-4 mr-2" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
          <Checkbox
            checked={checked}
            onCheckedChange={() => toggleSelect(event.id)}
            aria-label={`Select programme: ${event.title}`}
          />
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
            <Button variant="outline" size="icon" onClick={() => handleRestore([event.id])} aria-label={`Restore archived programme ${event.title}`} title={`Restore (“${event.title}”)`}>
              <ArchiveRestore className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" size="icon" onClick={() => handleArchive([event.id])} aria-label={`Archive programme ${event.title}`} title={`Archive (hides “${event.title}”)`}>
              <Archive className="h-4 w-4" />
            </Button>
          )}
          {deleteAllowed && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Delete programme ${event.title}`} title={`Delete permanently (“${event.title}”)`}>
                <Trash2 className="h-4 w-4" />
              </Button>
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
    type CalItem = { event: (typeof filteredEvents)[number]; segment: "single" | "start" | "middle" | "end" };

    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    const days: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      days.push(d);
      d = addDays(d, 1);
    }

    const eventsByDay = new Map<string, CalItem[]>();
    filteredEvents.forEach((e) => {
      const startD = startOfDay(new Date(e.date));
      const endD0 = e.end_date ? startOfDay(new Date(e.end_date)) : startD;
      const endD = endD0 < startD ? startD : endD0;
      const rangeDays = eachDayOfInterval({ start: startD, end: endD });
      const multi = rangeDays.length > 1;
      rangeDays.forEach((dayDt) => {
        const key = format(dayDt, "yyyy-MM-dd");
        let segment: CalItem["segment"] = "single";
        if (multi) {
          if (isSameDay(dayDt, startD)) segment = "start";
          else if (isSameDay(dayDt, endD)) segment = "end";
          else segment = "middle";
        }
        const arr = eventsByDay.get(key) ?? [];
        arr.push({ event: e, segment });
        eventsByDay.set(key, arr);
      });
    });

    return (
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b gap-2 flex-wrap">
          <h3 className="text-lg font-semibold">{format(calendarMonth, "MMMM yyyy")}</h3>
          <div className="flex gap-2 items-center flex-wrap justify-end ml-auto">
            {selected.size > 0 ? renderExportSelectionDropdown() : null}
            <div className="flex gap-1">
            <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCalendarMonth(new Date())}>Today</Button>
            <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground px-4 py-2 border-b leading-relaxed">
          <span className="font-medium text-foreground">Browse only:</span> use List view to tick boxes and archive, restore, export, or delete.{" "}
          Multi-day programmes show on each day they run:&nbsp;
          <span className="whitespace-nowrap font-medium tabular-nums">▶ start · ⋯ middle days · ■ last day.</span>
        </p>
        <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((wk) => (
            <div key={wk} className="p-2 text-center">{wk}</div>
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
                  {dayEvents.slice(0, 3).map(({ event: ev, segment }) => {
                    const spanRange =
                      ev.end_date && !isSameDay(new Date(ev.date), new Date(ev.end_date))
                        ? `${format(startOfDay(new Date(ev.date)), "d MMM")}–${format(startOfDay(new Date(ev.end_date)), "d MMM")}`
                        : "";
                    const phase =
                      segment === "start" ? "starts" : segment === "middle" ? "continues" : segment === "end" ? "ends" : "";
                    const glyph = segment === "start" ? "▶ " : segment === "middle" ? "⋯ " : segment === "end" ? "■ " : "";
                    const hint = phase ? `${ev.title}${spanRange ? ` (${spanRange})` : ""} — ${phase}` : ev.title;
                    return (
                      <Link
                        key={`${ev.id}-${segment}-${format(day, "yyyy-MM-dd")}`}
                        to={`/events/${ev.id}`}
                        className={`block truncate text-xs px-1.5 py-0.5 rounded tabular-nums ${
                          ev.derivedStatus === "aborted"
                            ? "bg-destructive/20 text-destructive"
                            : ev.derivedStatus === "past"
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-primary/15 text-primary hover:bg-primary/25"
                        }`}
                        title={hint}
                        aria-label={hint}
                      >
                        <span aria-hidden>{glyph}</span>
                        {ev.title}
                      </Link>
                    );
                  })}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1>Programmes</h1>
            <p className="text-muted-foreground">Coordinate your field operations.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center sm:shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Visible tab ({filteredEvents.length})
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={exportFilteredCsv}>
                  <FileText className="h-4 w-4 mr-2" /> CSV (whole tab)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportFilteredPdf}>
                  <FileText className="h-4 w-4 mr-2" /> PDF (whole tab)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Tick rows in List, then export ({selected.size} selected)
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={exportSelectedCsv} disabled={selected.size === 0}>
                  <FileText className="h-4 w-4 mr-2" /> CSV (selected only)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportSelectedPdf} disabled={selected.size === 0}>
                  <FileText className="h-4 w-4 mr-2" /> PDF (selected only)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {staffManage && <Button asChild><Link to="/events/new">Plan Programme</Link></Button>}
          </div>
        </div>
      </ScrollReveal>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => { setFilter(v as FilterMode); clearSelection(); }} className="w-full sm:w-auto overflow-x-auto">
          <TabsList>
            <TabsTrigger value="all">All Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Completed</TabsTrigger>
            <TabsTrigger value="aborted">Aborted</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)} className="w-full sm:w-auto overflow-x-auto">
          <TabsList>
            <TabsTrigger value="list"><LayoutGrid className="h-4 w-4 mr-1" />List</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-1" />Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
        <span className="font-medium text-foreground">Archive vs Delete:</span> Archive hides a programme from active lists but keeps its history—you can restore it later.&nbsp;
        Delete removes it permanently and cannot be undone (committee roles only). Prefer archive unless you intentionally purge data.
      </p>

      {view === "calendar" && selected.size > 0 ? (
        <p className="md:hidden rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground tabular-nums" role="status">
          <span className="font-medium text-foreground">{selected.size} selected.</span> Open List view to archive, restore, or delete in bulk.
        </p>
      ) : null}

      {/* Bulk action bar */}
      {view === "list" && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
          <Checkbox
            checked={selected.size > 0 && selected.size === filteredEvents.length}
            onCheckedChange={(c) => (c ? selectAll() : clearSelection())}
            aria-label="Select all programmes in this tab"
          />
          <span className="text-sm text-muted-foreground tabular-nums">
            {selected.size > 0 ? `${selected.size} selected` : "Select programmes for bulk actions"}
          </span>
          <div className="ml-auto flex flex-wrap gap-2 items-center">
            {staffManage && (filter === "archived" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={selected.size === 0}
                onClick={() => selected.size > 0 && handleRestore(Array.from(selected))}
              >
                <ArchiveRestore className="h-4 w-4 mr-1" />
                Restore
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={selected.size === 0}
                onClick={() => selected.size > 0 && handleArchive(Array.from(selected))}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            ))}
            {deleteAllowed && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" disabled={selected.size === 0}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selected.size} programme(s)?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes selected programmes—unlike Archive, deleted data cannot be restored. Prefer Archive if you only need to tidy the main list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(Array.from(selected))} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button size="sm" variant="ghost" disabled={selected.size === 0} onClick={() => selected.size > 0 && clearSelection()}>
              Clear
            </Button>
            {renderExportSelectionDropdown()}
          </div>
        </div>
      )}

      {view === "calendar" ? (
        renderCalendar()
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 px-4">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="mb-2 text-lg font-semibold">
            {filter === "archived"
              ? "No archived programmes"
              : filter === "aborted"
                ? "No aborted programmes"
                : filter === "past"
                  ? "No completed programmes in this tab"
                  : filter === "upcoming"
                    ? "No upcoming programmes"
                    : "No programmes in this tab"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
            {filter === "archived"
              ? "Archived items stay hidden from Active tabs but remain recoverable. Archive from the programme card when you want a tidy list without deleting history."
              : filter === "aborted"
                ? "Aborted programmes are kept for auditing. Recently cancelled entries may still appear under All Active until you archive them."
                : filter === "past"
                  ? "Completed programmes move here once their date passes. Finished a big op? Draft an AAR from the programme detail page."
                  : filter === "upcoming"
                    ? "Nothing scheduled ahead on the calendar yet. Draft dates, invite participants, then track loadout—all from a new programme plan."
                    : "Plan your first field operation to start coordinating participants, roles, and gear."}
          </p>
          {staffManage && filter !== "archived" && filter !== "aborted" && (
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/events/new">Plan programme</Link>
              </Button>
              {(filter === "past" || filter === "upcoming") && (
                <Button variant="outline" size="lg" onClick={() => setFilter("all")}>
                  View all active
                </Button>
              )}
            </div>
          )}
          {filter === "archived" && (
            <Button variant="outline" size="lg" onClick={() => setFilter("all")}>
              Back to active programmes
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
