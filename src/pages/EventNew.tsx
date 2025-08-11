
import React, { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import EventForm from "@/components/events/EventForm";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";

const EventNew = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const redirect = encodeURIComponent(location.pathname);
        navigate(`/auth?redirect=${redirect}`);
      }
    };
    checkAuth();
  }, [navigate, location.pathname]);

  return (
    <MainLayout>
      <EventForm />
    </MainLayout>
  );
};

export default EventNew;
