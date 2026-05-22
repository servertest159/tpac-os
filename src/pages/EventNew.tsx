
import React from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import EventForm from "@/components/events/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canStaffManage } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";

const EventNew = () => {
  const { id } = useParams();
  const allowed = canStaffManage();

  if (!allowed) {
    return (
      <MainLayout>
        <Card className="card-premium max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Committee access only
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Members can view programmes and file AARs, but programme planning and edits are for committee roles.
            </p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <EventForm eventId={id} />
    </MainLayout>
  );
};

export default EventNew;
