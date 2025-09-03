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
import { Trash2 } from "lucide-react";

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
        }
      } else {
        // Use edge function for non-authenticated users with access codes
        const accessCode = localStorage.getItem('tpac_access_code');
        if (!accessCode) throw new Error("No access code found");

        if (isEditing) {
          throw new Error("Cannot edit programmes without authentication");
        }

        const { data, error } = await supabase.functions.invoke('create-event', {
          body: {
            accessCode: accessCode,
            eventData: eventData,
            roleRequirements: roleRequirements.filter(r => r.role && r.quantity > 0)
          }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Failed to create programme');
        
        eventIdToUse = data.eventId;
      }

      toast({
        title: isEditing ? "Programme Updated" : "Programme Planned",
        description: `The programme details for '${formData.title}' have been saved successfully.`,
      });
      navigate("/events");
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "plan"} programme. ${error instanceof Error ? error.message : ''}`,
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

  const handleCancel = () => {
    navigate("/events");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Programme" : "Plan New Programme"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Programme Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="E.g., 'Ubin Kayak Patrol'"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2 rounded-md border p-4">
                {roleRequirements.map((req, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                        <Select
                            value={req.role}
                            onValueChange={(value) => handleRequirementChange(index, 'role', value)}
                        >
                            <SelectTrigger>
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
                            className="w-20"
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
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : (isEditing ? "Update Programme" : "Plan Programme")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EventForm;
