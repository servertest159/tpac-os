
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Participant {
  id: string;
  name: string;
  role?: string;
}

interface EventParticipantsManualProps {
  eventId: string;
  maxParticipants?: number;
  initialParticipants?: Participant[];
}

const EventParticipantsManual = ({ eventId, maxParticipants = 10, initialParticipants = [] }: EventParticipantsManualProps) => {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantRole, setNewParticipantRole] = useState("");

  const handleAddParticipant = () => {
    if (newParticipantName.trim()) {
      const newParticipant: Participant = {
        id: Date.now().toString(),
        name: newParticipantName.trim(),
        role: newParticipantRole.trim() || undefined
      };
      setParticipants([...participants, newParticipant]);
      setNewParticipantName("");
      setNewParticipantRole("");
      setShowAddDialog(false);
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants ({participants.length}/{maxParticipants})
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={participants.length >= maxParticipants}>
                <Plus className="h-4 w-4 mr-2" />
                Add Participant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Participant</DialogTitle>
                <DialogDescription>
                  Add a new participant to this programme.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="participant-name">Name</Label>
                  <Input
                    id="participant-name"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    placeholder="Enter participant name"
                  />
                </div>
                <div>
                  <Label htmlFor="participant-role">Role (Optional)</Label>
                  <Input
                    id="participant-role"
                    value={newParticipantRole}
                    onChange={(e) => setNewParticipantRole(e.target.value)}
                    placeholder="e.g., Leader, Navigator, Medic"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddParticipant} disabled={!newParticipantName.trim()}>
                  Add Participant
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No participants added yet.</p>
            <p className="text-sm">Click "Add Participant" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    {participant.role && (
                      <Badge variant="secondary" className="text-xs">
                        {participant.role}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveParticipant(participant.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventParticipantsManual;
