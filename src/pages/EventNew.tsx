
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import EventForm from "@/components/events/EventForm";
import { supabase } from "@/integrations/supabase/client";

const EventNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = id ? 'Edit Programme - TPAC OS' : 'Plan Programme - TPAC OS';
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/auth", { replace: true });
      }
    });
  }, [id, navigate]);
  
  return (
    <MainLayout>
      <EventForm eventId={id} />
    </MainLayout>
  );
};

export default EventNew;
