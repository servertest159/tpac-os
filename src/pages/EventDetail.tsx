import React from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import EventDetailComponent from "@/components/events/EventDetail";
import EventForm from "@/components/events/EventForm";
import EventInvite from "@/components/events/EventInvite";

const EventDetail = () => {
  const { id, action } = useParams();
  
  return (
    <MainLayout>
      {action === "edit" ? (
        <EventForm eventId={id} />
      ) : (
        <EventDetailComponent />
      )}
    </MainLayout>
  );
};

export default EventDetail;
