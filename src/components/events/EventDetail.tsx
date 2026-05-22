
import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, Edit, Trash2, AlertCircle, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEventDetail } from "@/hooks/useEventDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import EventParticipantsPanel from "./EventParticipantsPanel";
import EventLoadoutPanel from "./EventLoadoutPanel";
import EventItineraryPanel from "./EventItineraryPanel";
import { Card, CardContent } from "@/components/ui/card";
import { canDeleteProgrammes, canStaffManage } from "@/lib/auth";
import { deleteProgrammes } from "@/lib/deleteProgrammes";
import { foreignKeyViolationMessage } from "@/lib/dbErrors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildAndDownloadProgrammeDetailPdf } from "@/lib/exportProgrammeDetailPdf";

const EventDetailSkeleton = () => (
  <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <Card>
        <CardContent className="pt-6">
            <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
  </div>
);

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { event, loading, error, refetch } = useEventDetail(id);

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = React.useState("");
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const deleteMatches = deleteConfirmInput.trim().toUpperCase() === "DELETE";
  const staffManage = canStaffManage();

  React.useEffect(() => {
    if (!showDeleteDialog) setDeleteConfirmInput("");
  }, [showDeleteDialog]);

  const handleDeleteProgramme = async () => {
    if (!id || !deleteMatches) return;
    setDeleteBusy(true);
    
    try {
      const { deletedCount, failed } = await deleteProgrammes([id]);
      if (failed.length > 0) {
        const fk =
          foreignKeyViolationMessage(new Error(failed[0].message)) ?? failed[0].message;
        toast({
          title: "Failed to delete programme",
          description: fk,
          variant: "destructive",
        });
        return;
      }
      if (deletedCount < 1) {
        toast({
          title: "Failed to delete programme",
          description: "Nothing was deleted. Refresh and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Programme Deleted",
        description: "The programme and all related data have been permanently removed.",
      });
      setShowDeleteDialog(false);
      navigate('/events');
    } catch (err) {
      console.error('Error deleting programme:', err);
      const fk = foreignKeyViolationMessage(err);
      const msg =
        fk ??
          (err instanceof Error
            ? err.message
            : "An error occurred while deleting the programme.");
      toast({
        title: "Failed to delete programme",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleExportPdf = async () => {
    if (!event || !id) return;
    setPdfBusy(true);
    try {
      await buildAndDownloadProgrammeDetailPdf(event, id);
      toast({
        title: "PDF exported",
        description: `Saved a briefing pack for "${event.title}".`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Could not export PDF",
        description: err instanceof Error ? err.message : "Try again shortly.",
        variant: "destructive",
      });
    } finally {
      setPdfBusy(false);
    }
  };

  if (loading) {
    return <EventDetailSkeleton />;
  }

  if (error || !event) {
    return (
      <Alert variant="destructive" className="mt-4 animate-fade-in">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || "Could not load event details."}</AlertDescription>
        <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
      </Alert>
    );
  }

  const status = new Date(event.date) > new Date() ? 'upcoming' : 'completed';
  const participants = event.event_invitations
    .filter(inv => inv.status === 'accepted')
    .map(inv => inv.profiles)
    .filter((p): p is NonNullable<typeof p> => p !== null);
  
  const maxParticipants = event.max_participants || 0;

  const getStatusBadge = () => {
    return (
      <Badge variant={status === "upcoming" ? "default" : "secondary"}>
        {status === "upcoming" ? "Upcoming" : "Completed"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between animate-fade-in">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words">{event.title}</h1>
            {getStatusBadge()}
          </div>
          <p className="text-muted-foreground">
            Programme Debrief & Coordination
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end sm:shrink-0">
            <Button variant="outline" className="hover-scale" disabled={pdfBusy} onClick={() => void handleExportPdf()}>
              <FileDown className="mr-2 h-4 w-4" />
              {pdfBusy ? "Preparing PDF…" : "Export PDF"}
            </Button>
            {staffManage && (
              <Button asChild variant="outline" className="hover-scale">
                <Link to={`/events/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
            {canDeleteProgrammes() && (
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="hover-scale">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Programme
                </Button>
              </DialogTrigger>
              <DialogContent className="animate-scale-in">
                <DialogHeader>
                  <DialogTitle>Delete Programme</DialogTitle>
                  <DialogDescription>
                    Delete permanently removes this programme—including main committee member records, loadout links, itinerary, and other linked rows.
                    This cannot be undone. Prefer Archive if you only need to hide it from active lists.
                  </DialogDescription>
                  <p className="text-sm font-medium leading-snug" aria-live="polite">
                    Confirming:&nbsp;<span className="text-foreground">{event.title}</span>
                  </p>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="delete-confirm-programme">
                    Type <span className="font-mono font-semibold tracking-wide text-foreground">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="delete-confirm-programme"
                    autoComplete="off"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder="DELETE"
                    disabled={deleteBusy}
                    aria-required="true"
                    className="font-mono"
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" disabled={deleteBusy} onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={!deleteMatches || deleteBusy}
                    onClick={() => void handleDeleteProgramme()}
                  >
                    {deleteBusy ? "Deleting…" : "Confirm Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Main Committee</TabsTrigger>
          <TabsTrigger value="gear">Loadout</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4 animate-fade-in">
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">Programme Intel</h3>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(event.date), "p")}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {participants.length} / {maxParticipants} main committee members confirmed
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg">Description</h3>
                    <p className="mt-2 text-muted-foreground whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">Field Actions</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <Button asChild variant="outline">
                        <Link to={`/feedback/new?eventId=${id}`}>
                          File After-Action Report (AAR)
                        </Link>
                      </Button>
                      <Button asChild variant="secondary">
                        <Link to={`/events/${id}/gear`}>
                          Check Inventory Loadout
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="participants" className="space-y-4 pt-4 animate-fade-in">
          <EventParticipantsPanel
            invitations={event.event_invitations}
            participantsCount={participants.length}
          />
        </TabsContent>
        
        <TabsContent value="gear" className="space-y-4 pt-4 animate-fade-in">
          <EventLoadoutPanel eventDateISO={event.date} eventEndDateISO={event.end_date} />
        </TabsContent>
        
        <TabsContent value="itinerary" className="space-y-4 pt-4 animate-fade-in">
          <EventItineraryPanel items={event.itinerary_items ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetail;
