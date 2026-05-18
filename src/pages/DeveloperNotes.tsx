import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Compass, KeyRound, Database, LifeBuoy, Clock } from "lucide-react";

const DeveloperNotes = () => {
  return (
    <MainLayout>
      <div className="space-y-6 page-enter max-w-3xl mx-auto">
        <ScrollReveal variant="fade-up">
          <div>
            <h1>System Notes</h1>
            <p className="text-muted-foreground">
              What this software is, and how to keep it running for the long haul.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={80}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5" />
                Purpose
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                TPAC OS is the club's operating system for programmes: events, gear, participants,
                itineraries, emergency contacts and after-action reports — all in one place,
                in real time.
              </p>
              <p className="italic">Built by Fittra Syaifullah, AY 25/26. Designed to outlive any single committee.</p>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={120}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Access & Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Sign-in uses 6-digit access codes managed entirely from inside the app —
                no source code changes required to onboard a new committee.
              </p>
              <ul className="space-y-1 pl-4">
                <li>• <strong className="text-foreground">President & Vice-President</strong> manage codes at <code>/admin/access</code> (issue, rotate, deactivate).</li>
                <li>• <strong className="text-foreground">All admin roles</strong> (Pres, VP, Hon Sec, Hon Treas, Training Heads, QM, Publicity) can manage gear, members, profiles and audit logs.</li>
                <li>• <strong className="text-foreground">Members</strong> have read access scoped to their own profile and assigned programmes.</li>
              </ul>
              <p>At every AY hand-over: rotate codes, update holder names. That is the entire transition.</p>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={160}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data & Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                All data lives in Supabase (Postgres). Every sensitive table has Row Level Security
                and an audit log. Photos and documents are stored in Supabase Storage buckets.
              </p>
              <p>
                The UI updates in real time via Postgres change listeners — there is no manual refresh
                or refetch logic to maintain.
              </p>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={200}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Built for 5+ Years
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="space-y-2 pl-4">
                <li>• <strong className="text-foreground">No hardcoded people.</strong> Codes, roles and form links live in the database, editable in-app.</li>
                <li>• <strong className="text-foreground">Soft deletes & audit logs.</strong> Nothing is truly lost; every sensitive action is traceable.</li>
                <li>• <strong className="text-foreground">Self-healing UI.</strong> Error boundaries and offline banners recover without a developer.</li>
                <li>• <strong className="text-foreground">Stable stack.</strong> React + Supabase — both have long-term support commitments.</li>
                <li>• <strong className="text-foreground">Documented in-app.</strong> Future committees read this page, not a Notion doc that gets lost.</li>
              </ul>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={240}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5" />
                When Something Breaks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Try in this order:</p>
              <ol className="space-y-1 pl-4 list-decimal list-inside">
                <li>Reload the page — the offline banner will reconnect automatically.</li>
                <li>Check <code>/admin/access</code> if a login is failing — the code may be deactivated or expired.</li>
                <li>Review audit logs in the admin area to see who changed what, and when.</li>
                <li>Only if none of the above works, contact the original maintainer.</li>
              </ol>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </MainLayout>
  );
};

export default DeveloperNotes;
