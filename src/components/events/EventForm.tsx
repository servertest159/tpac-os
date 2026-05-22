import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";

export interface ItineraryFormRow {
  key: string;
  day: number;
  time: string;
  activity: string;
  location: string;
}

function newItineraryRow(partial?: Partial<Omit<ItineraryFormRow, "key">>): ItineraryFormRow {
  return {
    key: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    day: partial?.day ?? 1,
    time: partial?.time ?? "",
    activity: partial?.activity ?? "",
    location: partial?.location ?? "",
  };
}

/** Rows with a non-empty activity are saved as itinerary_items (trip_id = event id). */
function itineraryRowsToPayload(rows: ItineraryFormRow[]) {
  return rows
    .filter((r) => r.activity.trim().length > 0)
    .map((r) => ({
      day: Math.max(1, Math.floor(Number(r.day)) || 1),
      time: r.time.trim() || null,
      activity: r.activity.trim(),
      location: r.location.trim() || null,
    }));
}

async function persistItineraryRows(tripId: string, rows: ItineraryFormRow[]) {
  const { error: delError } = await supabase.from("itinerary_items").delete().eq("trip_id", tripId);
  if (delError) throw delError;
  const payload = itineraryRowsToPayload(rows).map((r) => ({ trip_id: tripId, ...r }));
  if (payload.length > 0) {
    const { error } = await supabase.from("itinerary_items").insert(payload);
    if (error) throw error;
  }
}

interface EventFormProps {
  eventId?: string;
}

type Role = Enums<'app_role'>;
const appRoles = Constants.public.Enums.app_role.filter(r => r !== 'Member');

interface RoleRequirement {
  role: Role | "";
  quantity: number;
}

const EventForm: React.FC<EventFormProps> = ({ eventId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!eventId;
  
  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    location: "",
    description: "",
    max_participants: 10,
  });
  const [roleRequirements, setRoleRequirements] = useState<RoleRequirement[]>([]);
  const [itineraryRows, setItineraryRows] = useState<ItineraryFormRow[]>([newItineraryRow()]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && eventId) {
      fetchEvent();
    }
  }, [isEditing, eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_role_requirements(*)')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      if (data) {
        const startDate = new Date(data.date);
        const startDateStr = startDate.toISOString().split('T')[0];
        const startTimeStr = startDate.toTimeString().split(' ')[0].slice(0, 5);
        
        let endDateStr = "";
        let endTimeStr = "";
        if (data.end_date) {
          const endDate = new Date(data.end_date);
          endDateStr = endDate.toISOString().split('T')[0];
          endTimeStr = endDate.toTimeString().split(' ')[0].slice(0, 5);
        }

        setFormData({
          title: data.title,
          start_date: startDateStr,
          start_time: startTimeStr,
          end_date: endDateStr,
          end_time: endTimeStr,
          location: data.location || "",
          description: data.description || "",
          max_participants: data.max_participants || 10,
        });

        if (data.event_role_requirements) {
          setRoleRequirements(
            data.event_role_requirements.map(r => ({ role: r.role, quantity: r.quantity }))
          );
        }

        const { data: itineraryData, error: itineraryError } = await supabase
          .from("itinerary_items")
          .select("*")
          .eq("trip_id", eventId)
          .order("day", { ascending: true });

        if (!itineraryError && itineraryData && itineraryData.length > 0) {
          setItineraryRows(
            itineraryData.map((row) => ({
              key: row.id,
              day: row.day,
              time: row.time ?? "",
              activity: row.activity ?? "",
              location: row.location ?? "",
            })),
          );
        } else {
          setItineraryRows([newItineraryRow()]);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load programme data",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if user is authenticated OR has valid access code
    const accessCode = localStorage.getItem('tpac_access_code');
    
    if (!session && !accessCode) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in or have a valid access code to manage programmes.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    try {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      let endDateTime = null;
      
      if (formData.end_date && formData.end_time) {
        endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      } else if (formData.end_date) {
        // If only end date is provided, use start time
        endDateTime = new Date(`${formData.end_date}T${formData.start_time}`);
      }
      
      const eventData = {
        title: formData.title,
        date: startDateTime.toISOString(),
        end_date: endDateTime ? endDateTime.toISOString() : null,
        location: formData.location,
        description: formData.description,
        max_participants: formData.max_participants,
      };

      let eventIdToUse = eventId;

      // If user is authenticated, use normal flow
      if (session) {
        if (isEditing && eventId) {
          const { error } = await supabase
            .from('events')
            .update({ ...eventData, status: 'active', updated_at: new Date().toISOString() })
            .eq('id', eventId);
          if (error) throw error;
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("User not found");
          const { data: newEvent, error } = await supabase
            .from('events')
            .insert([{ ...eventData, creator_id: user.id, status: 'active', updated_at: new Date().toISOString() }])
            .select('id')
            .single();
          if (error) throw error;
          if (newEvent) {
            eventIdToUse = newEvent.id;
          }
        }

        if (eventIdToUse) {
          const { error: deleteError } = await supabase.from('event_role_requirements').delete().eq('event_id', eventIdToUse);
          if (deleteError) throw deleteError;

          const newRequirements = roleRequirements
            .filter(r => r.role && r.quantity > 0)
            .map(r => ({
              event_id: eventIdToUse!,
              role: r.role as Role,
              quantity: Number(r.quantity),
            }));

          if (newRequirements.length > 0) {
            const { error: insertError } = await supabase.from('event_role_requirements').insert(newRequirements);
            if (insertError) throw insertError;
          }

          await persistItineraryRows(eventIdToUse, itineraryRows);
        }
      } else {
        // Use edge functions for non-authenticated users with access codes
        const accessCode = localStorage.getItem('tpac_access_code');
        if (!accessCode) throw new Error("No access code found");

        const filteredRequirements = roleRequirements.filter(r => r.role && r.quantity > 0);

        if (isEditing && eventId) {
          const { data, error } = await supabase.functions.invoke('update-event', {
            body: {
              accessCode,
              eventId,
              eventData,
              roleRequirements: filteredRequirements,
              itineraryItems: itineraryRowsToPayload(itineraryRows),
            }
          });

          if (error) throw error;
          if (!data.success) throw new Error(data.error || 'Failed to update programme');
          eventIdToUse = eventId;
        } else {
          const { data, error } = await supabase.functions.invoke('create-event', {
            body: {
              accessCode,
              eventData,
              roleRequirements: filteredRequirements,
              itineraryItems: itineraryRowsToPayload(itineraryRows),
            }
          });

          if (error) throw error;
          if (!data.success) throw new Error(data.error || 'Failed to create programme');
          eventIdToUse = data.eventId;
        }
      }

      toast({
        title: isEditing ? "Programme Updated" : "Programme Planned",
        description: `The programme details for '${formData.title}' have been saved successfully.`,
      });
      navigate("/events");
    } catch (error) {
      console.error('Error saving event:', error);
      const detail = error instanceof Error ? error.message.trim() : "";
      toast({
        title: "Error",
        description: `${detail ? `${detail}. ` : ""}Your edits are still in this form—check your connection, then try Save again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'max_participants' ? Math.max(1, parseInt(value, 10) || 1) : value,
    }));
  };

  const handleRequirementChange = (index: number, field: keyof RoleRequirement, value: string | number) => {
    const newRequirements = [...roleRequirements];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    setRoleRequirements(newRequirements);
  };

  const addRequirement = () => {
    setRoleRequirements([...roleRequirements, { role: "", quantity: 1 }]);
  };

  const removeRequirement = (index: number) => {
    const newRequirements = roleRequirements.filter((_, i) => i !== index);
    setRoleRequirements(newRequirements);
  };

  const handleItineraryField = (
    key: string,
    field: keyof Omit<ItineraryFormRow, "key">,
    value: string | number,
  ) => {
    setItineraryRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              [field]:
                field === "day"
                  ? Math.max(1, Math.floor(Number(value)) || 1)
                  : (value as string),
            }
          : r,
      ),
    );
  };

  const addItineraryRow = () =>
    setItineraryRows((prev) => [...prev, newItineraryRow({ day: prev[prev.length - 1]?.day ?? 1 })]);

  const removeItineraryRow = (key: string) =>
    setItineraryRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));

  const moveItineraryRow = (index: number, dir: -1 | 1) => {
    setItineraryRows((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const handleCancel = () => {
    navigate("/events");
  };

  return (
    <Card className="animate-fade-in-up card-hover">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Programme" : "Plan New Programme"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <fieldset disabled={loading} className="space-y-4 min-w-0 border-0 p-0 m-0 disabled:opacity-[0.75] disabled:pointer-events-none">
          <div className="space-y-2 form-field">
            <Label htmlFor="title">Programme Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="E.g., 'Ubin Kayak Patrol'"
              required
              className="focus-ring"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 form-field">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="focus-ring"
              />
            </div>
            <div className="space-y-2 form-field">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location / Waypoint</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="E.g., 'Changi Point Ferry Terminal'"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Programme Brief</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a detailed programme brief: objectives, route, and special considerations..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label>Itinerary</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Optional schedule: day number (for multi-day programmes), local time, activity, and location or waypoint.
              </p>
            </div>
            <div className="rounded-md border p-4 space-y-4">
              {itineraryRows.map((row, index) => (
                <div
                  key={row.key}
                  className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-3 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1 w-full lg:w-16 shrink-0">
                    <Label className="text-xs">Day</Label>
                    <Input
                      type="number"
                      min={1}
                      value={row.day}
                      onChange={(e) => handleItineraryField(row.key, "day", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1 w-full lg:w-32 shrink-0">
                    <Label className="text-xs">Time</Label>
                    <Input
                      type="time"
                      value={row.time}
                      onChange={(e) => handleItineraryField(row.key, "time", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <Label className="text-xs">Activity</Label>
                    <Input
                      value={row.activity}
                      onChange={(e) => handleItineraryField(row.key, "activity", e.target.value)}
                      placeholder="e.g. Briefing, transit to site, activity block"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <Label className="text-xs">Location / notes</Label>
                    <Input
                      value={row.location}
                      onChange={(e) => handleItineraryField(row.key, "location", e.target.value)}
                      placeholder="Waypoint or extra detail"
                      className="h-9"
                    />
                  </div>
                  <div className="flex gap-1 shrink-0 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => moveItineraryRow(index, -1)}
                      aria-label="Move row up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => moveItineraryRow(index, 1)}
                      aria-label="Move row down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => removeItineraryRow(row.key)}
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addItineraryRow} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add itinerary step
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max_participants">Max Crew Size</Label>
            <Input
              id="max_participants"
              name="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={handleChange}
              min={1}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Role Requirements</Label>
            <div className="space-y-3 rounded-md border p-3 sm:p-4">
                {roleRequirements.map((req, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                        <Select
                            value={req.role}
                            onValueChange={(value) => handleRequirementChange(index, 'role', value)}
                        >
                            <SelectTrigger className="col-span-2 sm:col-span-1">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {appRoles.map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="number"
                            min={1}
                            value={req.quantity}
                            onChange={(e) => handleRequirementChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                            className="w-full sm:w-20"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRequirement(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remove role</span>
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={addRequirement} className="mt-2 w-full">
                    Add Role Requirement
                </Button>
            </div>
          </div>
          </fieldset>
        </CardContent>
        
        <CardFooter className="grid grid-cols-1 gap-2 sm:flex sm:justify-between">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Saving..." : (isEditing ? "Update Programme" : "Plan Programme")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EventForm;
