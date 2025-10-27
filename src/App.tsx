
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import "./App.css";

import { Toaster } from "@/components/ui/toaster";
import AccessGate from "@/components/auth/AccessGate";
function App() {
  const [hasAccess, setHasAccess] = useState<boolean>(() => localStorage.getItem('tpac_access_granted') === 'true');

  if (!hasAccess) {
    return <AccessGate onAccessGranted={() => setHasAccess(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/events" element={<Events />} />
        <Route path="/events/new" element={<EventNew />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/edit" element={<EventNew />} />
        <Route path="/events/:id/gear" element={<InventoryLoadout />} />
        <Route path="/gear" element={<Gear />} />
        <Route path="/gear/new" element={<GearNew />} />
        <Route path="/gear/:id/edit" element={<GearEdit />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/feedback/new" element={<FeedbackNew />} />
        <Route path="/inventory-loadout" element={<InventoryLoadout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
