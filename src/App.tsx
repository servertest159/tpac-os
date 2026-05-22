import { Suspense, lazy, useState, type ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Events = lazy(() => import("@/pages/Events"));
const EventNew = lazy(() => import("@/pages/EventNew"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const Gear = lazy(() => import("@/pages/Gear"));
const GearNew = lazy(() => import("@/pages/GearNew"));
const GearEdit = lazy(() => import("@/pages/GearEdit"));
const Feedback = lazy(() => import("@/pages/Feedback"));
const FeedbackNew = lazy(() => import("@/pages/FeedbackNew"));
const FeedbackReportDetail = lazy(() => import("@/pages/FeedbackReportDetail"));
const InventoryLoadout = lazy(() => import("@/pages/InventoryLoadout"));
const Profile = lazy(() => import("@/pages/Profile"));
const DeveloperNotes = lazy(() => import("@/pages/DeveloperNotes"));
const AdminAccess = lazy(() => import("@/pages/AdminAccess"));
const AdminExports = lazy(() => import("@/pages/AdminExports"));
const NotFound = lazy(() => import("@/pages/NotFound"));
import "./App.css";

import { Toaster } from "@/components/ui/toaster";
import AccessGate from "@/components/auth/AccessGate";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import ConnectionBanner from "@/components/ui/connection-banner";
import PageLoading from "@/components/PageLoading";

const Page = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PageLoading />}>{children}</Suspense>
);

function App() {
  const [hasAccess, setHasAccess] = useState<boolean>(() => localStorage.getItem("tpac_access_granted") === "true");

  if (!hasAccess) {
    return <AccessGate onAccessGranted={() => setHasAccess(true)} />;
  }

  return (
    <BrowserRouter>
      <ConnectionBanner />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Page><Dashboard /></Page>} />
          <Route path="/dashboard" element={<Page><Dashboard /></Page>} />

          <Route path="/events" element={<Page><Events /></Page>} />
          <Route path="/events/new" element={<Page><EventNew /></Page>} />
          <Route path="/events/:id" element={<Page><EventDetail /></Page>} />
          <Route path="/events/:id/edit" element={<Page><EventNew /></Page>} />
          <Route path="/events/:id/gear" element={<Page><InventoryLoadout /></Page>} />
          <Route path="/gear" element={<Page><Gear /></Page>} />
          <Route path="/gear/new" element={<Page><GearNew /></Page>} />
          <Route path="/gear/:id/edit" element={<Page><GearEdit /></Page>} />
          <Route path="/feedback" element={<Page><Feedback /></Page>} />
          <Route path="/feedback/report/:reportId" element={<Page><FeedbackReportDetail /></Page>} />
          <Route path="/feedback/new" element={<Page><FeedbackNew /></Page>} />
          <Route path="/inventory-loadout" element={<Page><InventoryLoadout /></Page>} />
          <Route path="/profile" element={<Page><Profile /></Page>} />
          <Route path="/admin/access" element={<Page><AdminAccess /></Page>} />
          <Route path="/admin/exports" element={<Page><AdminExports /></Page>} />
          <Route path="/developer-notes" element={<Page><DeveloperNotes /></Page>} />
          <Route path="*" element={<Page><NotFound /></Page>} />
        </Routes>
      </ErrorBoundary>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
