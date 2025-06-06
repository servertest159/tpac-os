
import React from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import EventDetailComponent from "@/components/events/EventDetail";
import EventForm from "@/components/events/EventForm";

const EventDetail = () => {
  const { id, action } = useParams();
  
  return (
    <MainLayout>
      {action === "edit" ? (
        <EventForm gearId={id} />
      ) : (
        <EventDetailComponent />
      )}
    </MainLayout>
  );
};

export default EventDetail;
