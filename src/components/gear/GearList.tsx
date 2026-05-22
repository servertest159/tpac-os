import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Edit, Trash2, RefreshCw, Archive, ArchiveRestore, Pencil } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import GearPhotoPreview from "./GearPhotoPreview";
import GearUtilizationChart from "./GearUtilizationChart";
import GearUsageHistory from "./GearUsageHistory";
import { useGearInventory, type GearItem } from "@/hooks/useGearInventory";
import { ScrollReveal, ScrollRevealGroup } from "@/components/ui/scroll-reveal";
import { supabase } from "@/integrations/supabase/client";
import { canStaffManage } from "@/lib/auth";

type ViewFilter = "active" | "archived";

const CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Needs Repair"];

const GearList = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewFilter, setViewFilter] = React.useState<ViewFilter>("active");
  const [archived, setArchived] = React.useState<GearItem[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false);
  const [bulkCondition, setBulkCondition] = React.useState<string>("");
  const [bulkType, setBulkType] = React.useState<string>("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const { toast } = useToast();
  const staffManage = canStaffManage();
  const { gear, loading, error, retryCount, deleteGear, refetch } = useGearInventory();

  const fetchArchived = React.useCallback(async () => {
    const { data } = await supabase
      .from("gear")
      .select("*")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });
    setArchived((data as any) || []);
  }, []);

  React.useEffect(() => {
    if (viewFilter === "archived") fetchArchived();
  }, [viewFilter, fetchArchived]);

  React.useEffect(() => {
    const channel = supabase
      .channel("gear-archive-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "gear" }, () => {
        if (viewFilter === "archived") fetchArchived();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [viewFilter, fetchArchived]);

  const sourceList: GearItem[] = viewFilter === "archived" ? archived : gear.filter((g) => !g.archived_at);
  const filteredGear = sourceList.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: string) =>
    setSelected((p) => {
      const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
  const selectAll = () => setSelected(new Set(filteredGear.map((g) => g.id)));
  const clearSelection = () => setSelected(new Set());

  const handleDelete = async (item: GearItem) => {
    try {
      await deleteGear(item.id);
      const { id: _id, ...snapshot } = item;
      toast({
        title: "Gear deleted",
        description: `${item.name} removed from inventory.`,
        action: (
          <ToastAction
            altText="Undo delete"
            onClick={async () => {
              const { error } = await supabase.from("gear").insert(snapshot as any);
              if (error) toast({ title: "Undo failed", description: error.message, variant: "destructive" });
              else { toast({ title: "Restored", description: item.name }); refetch(); }
            }}
          >
            Undo
          </ToastAction>
        ),
      });
    } catch (e) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const bulkArchive = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("gear").update({ archived_at: new Date().toISOString() }).in("id", ids);
    if (error) return toast({ title: "Archive failed", description: error.message, variant: "destructive" });
    toast({ title: "Archived", description: `${ids.length} item(s) archived.` });
    clearSelection();
    refetch();
  };

  const bulkRestore = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("gear").update({ archived_at: null }).in("id", ids);
    if (error) return toast({ title: "Restore failed", description: error.message, variant: "destructive" });
    toast({ title: "Restored", description: `${ids.length} item(s) restored.` });
    clearSelection();
    fetchArchived();
    refetch();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("gear").delete().in("id", ids);
    setConfirmDeleteOpen(false);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Deleted", description: `${ids.length} item(s) permanently removed.` });
    clearSelection();
    refetch();
    if (viewFilter === "archived") fetchArchived();
  };

  const applyBulkEdit = async () => {
    const ids = Array.from(selected);
    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (bulkCondition) update.condition = bulkCondition;
    if (bulkType.trim()) update.type = bulkType.trim();
    if (Object.keys(update).length === 1) {
      toast({ title: "Nothing to update", description: "Set a condition or type first." });
      return;
    }
    const { error } = await supabase.from("gear").update(update).in("id", ids);
    if (error) return toast({ title: "Bulk edit failed", description: error.message, variant: "destructive" });
    toast({ title: "Updated", description: `${ids.length} item(s) updated.` });
    setBulkEditOpen(false);
    setBulkCondition(""); setBulkType("");
    clearSelection();
    refetch();
  };

  const getConditionBadge = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "excellent":
        return <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white border-0 shadow-sm">Excellent</Badge>;
      case "good":
        return <Badge className="bg-gradient-to-r from-primary to-primary-glow text-white border-0 shadow-sm">Good</Badge>;
      case "fair":
        return <Badge variant="secondary" className="shadow-sm">Fair</Badge>;
      case "poor":
      case "needs repair":
        return <Badge variant="destructive" className="shadow-sm">Needs Repair</Badge>;
      default:
        return <Badge className="shadow-sm">{condition}</Badge>;
    }
  };

  if (error && retryCount >= 3) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><h1>Inventory</h1><p className="text-muted-foreground">Track and maintain your kit.</p></div>
          {staffManage && (
            <Button asChild><Link to="/gear/new">Log New Gear</Link></Button>
          )}
        </div>
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 mb-2">Failed to load inventory</h3>
          <Button onClick={refetch}><RefreshCw className="mr-2 h-4 w-4" />Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <ScrollReveal variant="fade-up">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><h1>Inventory</h1><p className="text-muted-foreground">Track and maintain your kit.</p></div>
          {staffManage && (
            <Button asChild><Link to="/gear/new">Log New Gear</Link></Button>
          )}
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={80}>
        <GearUtilizationChart gear={gear.filter((g) => !g.archived_at)} />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={120}>
        <GearUsageHistory />
      </ScrollReveal>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Tabs value={viewFilter} onValueChange={(v) => { setViewFilter(v as ViewFilter); clearSelection(); }} className="w-full sm:w-auto overflow-x-auto">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        {(loading || retryCount > 0) && (
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Refresh"}
          </Button>
        )}
      </div>

      {/* Bulk action bar */}
      {staffManage && (
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
        <Checkbox
          checked={selected.size > 0 && selected.size === filteredGear.length}
          onCheckedChange={(c) => (c ? selectAll() : clearSelection())}
          aria-label="Select all"
        />
        <span className="text-sm text-muted-foreground">
          {selected.size > 0 ? `${selected.size} selected` : "Select gear for bulk actions"}
        </span>
        {selected.size > 0 && (
          <div className="ml-auto flex flex-wrap gap-2">
            {viewFilter === "active" ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setBulkEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-1" />Bulk Edit
                </Button>
                <Button size="sm" variant="outline" onClick={bulkArchive}>
                  <Archive className="h-4 w-4 mr-1" />Archive
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={bulkRestore}>
                <ArchiveRestore className="h-4 w-4 mr-1" />Restore
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" />Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
          </div>
        )}
      </div>
      )}

      {loading && gear.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : filteredGear.length === 0 ? (
        <ScrollReveal variant="fade-up">
          <div className="text-center py-16 px-4">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="mb-2 text-lg font-semibold">
              {searchTerm
                ? "No matching gear"
                : viewFilter === "archived"
                ? "No archived gear yet"
                : "Your inventory is empty"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm
                ? `Nothing matches "${searchTerm}". Try a different name or category.`
                : viewFilter === "archived"
                ? "Archived gear will appear here. You can restore it any time."
                : "Log your first piece of equipment to start tracking conditions, availability, and maintenance."}
            </p>
            {viewFilter === "active" && !searchTerm && staffManage && (
              <Button asChild size="lg">
                <Link to="/gear/new">Add your first gear item</Link>
              </Button>
            )}
          </div>
        </ScrollReveal>
      ) : (
        <ScrollRevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={50}>
          {filteredGear.map((item) => {
            const checked = selected.has(item.id);
            return (
              <Card key={item.id} className={`card-premium card-hover hover-lift overflow-hidden relative ${staffManage && checked ? "ring-2 ring-primary" : ""}`}>
                {staffManage && (
                <div className="absolute top-3 left-3 z-10 bg-background/80 backdrop-blur rounded p-1">
                  <Checkbox checked={checked} onCheckedChange={() => toggleSelect(item.id)} aria-label="Select" />
                </div>
                )}
                <CardHeader className={`pb-3 ${staffManage ? "pl-12" : ""}`}>
                  <div className="flex gap-4 items-start">
                    <GearPhotoPreview
                      gearName={item.name}
                      photoUrl={item.photo_url}
                      uploadedAt={item.uploaded_at}
                      className="w-20 h-20 flex-shrink-0 ring-2 ring-border/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <CardTitle className="text-lg truncate leading-tight">{item.name}</CardTitle>
                        {viewFilter === "archived"
                          ? <Badge variant="secondary">Archived</Badge>
                          : getConditionBadge(item.condition)}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">{item.type}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <span className="text-xs text-muted-foreground block mb-1">Total</span>
                      <span className="text-xl font-bold text-foreground">{item.quantity}</span>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3 text-center ring-1 ring-primary/20">
                      <span className="text-xs text-muted-foreground block mb-1">Available</span>
                      <span className="text-xl font-bold text-primary">{item.available}</span>
                    </div>
                  </div>
                  {item.last_maintenance && (
                    <div className="flex items-center justify-between text-sm px-2 py-1.5 bg-muted/30 rounded-md">
                      <span className="text-muted-foreground">Last Maintenance</span>
                      <span className="font-medium">{new Date(item.last_maintenance).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
                {staffManage ? (
                <CardFooter className="flex gap-2 pt-4 border-t bg-muted/20">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/gear/${item.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link>
                  </Button>
                  {viewFilter === "archived" ? (
                    <Button variant="outline" size="sm" onClick={async () => {
                      const { error } = await supabase.from("gear").update({ archived_at: null }).eq("id", item.id);
                      if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
                      else { toast({ title: "Restored", description: item.name }); fetchArchived(); refetch(); }
                    }}><ArchiveRestore className="mr-2 h-4 w-4" />Restore</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={async () => {
                      const { error } = await supabase.from("gear").update({ archived_at: new Date().toISOString() }).eq("id", item.id);
                      if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
                      else toast({ title: "Archived", description: item.name });
                    }}><Archive className="mr-2 h-4 w-4" />Archive</Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" aria-label={`Delete ${item.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the item from inventory. You can undo from the toast shortly after.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
                ) : null}
              </Card>
            );
          })}
        </ScrollRevealGroup>
      )}

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk edit {selected.size} item(s)</DialogTitle>
            <DialogDescription>Leave a field blank to keep existing values.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={bulkCondition} onValueChange={setBulkCondition}>
                <SelectTrigger><SelectValue placeholder="No change" /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type / Category</Label>
              <Input value={bulkType} onChange={(e) => setBulkType(e.target.value)} placeholder="e.g. Climbing, Camping" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
            <Button onClick={applyBulkEdit}>Apply to {selected.size}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirm */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} item(s)?</DialogTitle>
            <DialogDescription>This permanently removes the selected gear and cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={bulkDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GearList;
