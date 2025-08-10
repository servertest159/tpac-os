
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import EventForm from "@/components/events/EventForm";
import { supabase } from "@/integrations/supabase/client";

const EventNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth");
    };
    checkAuth();
  }, [navigate]);
  
  return (
    <MainLayout>
      <EventForm eventId={id} />
    </MainLayout>
  );
};

export default EventNew;
