import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Events from "@/pages/Events";
import EventNew from "@/pages/EventNew";
import EventDetail from "@/pages/EventDetail";
import Gear from "@/pages/Gear";
import GearNew from "@/pages/GearNew";
import GearEdit from "@/pages/GearEdit";
import Feedback from "@/pages/Feedback";
import FeedbackNew from "@/pages/FeedbackNew";
import InventoryLoadout from "@/pages/InventoryLoadout";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import "./App.css";

import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check current session
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={!isAuthenticated ? <Auth /> : <Navigate to="/dashboard" replace />} />
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" replace />} />
        
        <Route path="/events" element={isAuthenticated ? <Events /> : <Navigate to="/auth" replace />} />
        <Route path="/events/new" element={isAuthenticated ? <EventNew /> : <Navigate to="/auth" replace />} />
        <Route path="/events/:id" element={isAuthenticated ? <EventDetail /> : <Navigate to="/auth" replace />} />
        <Route path="/events/:id/edit" element={isAuthenticated ? <EventNew /> : <Navigate to="/auth" replace />} />
        <Route path="/events/:id/gear" element={isAuthenticated ? <InventoryLoadout /> : <Navigate to="/auth" replace />} />
        <Route path="/gear" element={isAuthenticated ? <Gear /> : <Navigate to="/auth" replace />} />
        <Route path="/gear/new" element={isAuthenticated ? <GearNew /> : <Navigate to="/auth" replace />} />
        <Route path="/gear/:id/edit" element={isAuthenticated ? <GearEdit /> : <Navigate to="/auth" replace />} />
        <Route path="/feedback" element={isAuthenticated ? <Feedback /> : <Navigate to="/auth" replace />} />
        <Route path="/feedback/new" element={isAuthenticated ? <FeedbackNew /> : <Navigate to="/auth" replace />} />
        <Route path="/inventory-loadout" element={isAuthenticated ? <InventoryLoadout /> : <Navigate to="/auth" replace />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/auth" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
