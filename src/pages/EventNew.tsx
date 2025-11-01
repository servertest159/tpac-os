
import React from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import EventForm from "@/components/events/EventForm";

const EventNew = () => {
  const { id } = useParams();
  
  return (
    <MainLayout>
      <EventForm eventId={id} />
    </MainLayout>
  );
};

export default EventNew;
