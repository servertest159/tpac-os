
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventNew from "./pages/EventNew";
import Gear from "./pages/Gear";
import GearNew from "./pages/GearNew";
import GearEdit from "./pages/GearEdit";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import AccessGate from "@/components/auth/AccessGate";
import React, { useState, useEffect } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const [accessGranted, setAccessGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasAccess = localStorage.getItem("tpac_access_granted") === "true";
    setAccessGranted(hasAccess);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!accessGranted) {
    return <AccessGate onAccessGranted={() => setAccessGranted(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
          <>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/new" element={<EventNew />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:id/:action" element={<EventDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/gear" element={<Gear />} />
            <Route path="/gear/new" element={<GearNew />} />
            <Route path="/gear/:id/edit" element={<GearEdit />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="*" element={<NotFound />} />
          </>
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
