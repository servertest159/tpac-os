import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Compass, KeyRound, Database, LifeBuoy, Clock, Archive, FileDown } from "lucide-react";
import { isDeveloper } from "@/lib/auth";

const DeveloperNotes = () => {
  const dev = isDeveloper();

  return (
    <MainLayout>
      <div className="space-y-6 page-enter max-w-3xl mx-auto">
        <ScrollReveal variant="fade-up">
          <div>
            <h1>System Notes</h1>
            <p className="text-muted-foreground">
              {dev
                ? "Full internal notes: purpose, governance, ops, backups, exports, and support."
                : "Committee reference: purpose, access & roles, and CSV export workflows. Maintainer-only sections are hidden."}
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
                <li>• <strong className="text-foreground">Platform maintainer</strong> manages invite codes at <code>/admin/access</code> (issue, rotate, deactivate). That page is restricted to the developer session only.</li>
                <li>• <strong className="text-foreground">Committee roles</strong> — every code role except <strong className="text-foreground">Member</strong> — can manage gear, roster on Profile where shown, CSV exports (<code>/admin/exports</code>), AAR administration, and use operational tools; they do not open the Access Codes admin page.</li>
                <li>• <strong className="text-foreground">Member</strong> codes can view programmes and inventory, open any filed AAR to read the full submission, and file new reports. Gear, exports, invite codes, and linking or deleting AAR forms and reports remain committee responsibilities.</li>
              </ul>
              <p>At every AY hand-over: rotate codes, update holder names. That is the entire transition.</p>
            </CardContent>
          </Card>
        </ScrollReveal>

        {dev && (
        <>
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

        <ScrollReveal variant="fade-up" delay={220}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Backup & Restore
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Supabase takes automatic daily backups of the entire database. This checklist is for
                when a committee needs to export, restore, or hand over data deliberately.
              </p>
              <div>
                <p className="font-medium text-foreground mb-1">Routine backup (monthly, recommended)</p>
                <ol className="space-y-1 pl-4 list-decimal list-inside">
                  <li>Open the Supabase dashboard → <strong>Database → Backups</strong>.</li>
                  <li>Confirm the latest daily backup timestamp is within the last 24 hours.</li>
                  <li>For an off-site copy, run <code>Database → Export</code> and save the SQL dump to the club's shared drive, named <code>tpac-os-YYYY-MM-DD.sql</code>.</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Restoring after data loss</p>
                <ol className="space-y-1 pl-4 list-decimal list-inside">
                  <li>Stop further writes — deactivate non-admin codes at <code>/admin/access</code>.</li>
                  <li>In Supabase → <strong>Database → Backups</strong>, pick the most recent backup before the incident and click <strong>Restore</strong>.</li>
                  <li>Wait for the restore to complete (typically a few minutes), then reload the app.</li>
                  <li>Spot-check: latest programmes visible, gear list intact, access codes still work.</li>
                  <li>Re-activate the deactivated codes.</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Hand-over export (end of AY)</p>
                <ol className="space-y-1 pl-4 list-decimal list-inside">
                  <li>Export a full SQL dump as above and store it in the incoming committee's drive.</li>
                  <li>Export key tables to CSV (<code>events</code>, <code>gear</code>, <code>profiles</code>) for offline reference.</li>
                  <li>Rotate all access codes at <code>/admin/access</code> and update holder names.</li>
                </ol>
              </div>
              <p className="italic">Keep at least the last 3 monthly exports. Backups you can't find are backups you don't have.</p>
            </CardContent>
          </Card>
        </ScrollReveal>
        </>
        )}

        {!dev ? (
          <ScrollReveal variant="fade-up" delay={160}>
            <Card className="border-muted">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                <p>
                  Maintainer-only sections (data architecture, long-term posture, backups, and incident playbook) appear when you sign in with the designated developer session.
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        ) : null}

        <ScrollReveal variant="fade-up" delay={dev ? 240 : 140}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Exporting CSVs (Feedback & Gear)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Use this when you need offline copies of AAR feedback or the gear inventory — for
                hand-overs, reports, or external sharing.
              </p>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="font-medium text-foreground mb-1">In-app exports (fastest)</p>
                <p className="mb-2">
                  Go to <a href="/admin/exports" className="underline text-primary">/admin/exports</a> and click
                  Download CSV next to AAR Reports, AAR Form Links, Gear Inventory, or Gear Usage History.
                  No Supabase login needed.
                </p>
              </div>
              <p className="font-medium text-foreground pt-1">Or via Supabase dashboard (for custom queries):</p>
              <div>
                <p className="font-medium text-foreground mb-1">Export feedback (AAR forms & reports)</p>
                <ol className="space-y-1 pl-4 list-decimal list-inside">
                  <li>Open the Supabase dashboard → <strong>Table Editor</strong>.</li>
                  <li>Select the <code>aar_reports</code> table for filed reports (or <code>aar_forms</code> for form links).</li>
                  <li>Click the <strong>⋯</strong> menu in the top-right of the table → <strong>Export data as CSV</strong>.</li>
                  <li>Save the file as <code>aar-reports-YYYY-MM-DD.csv</code> to the club's shared drive.</li>
                  <li>Repeat for the other table if you need both.</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Export gear inventory</p>
                <ol className="space-y-1 pl-4 list-decimal list-inside">
                  <li>Open the Supabase dashboard → <strong>Table Editor</strong> → <code>gear</code>.</li>
                  <li>(Optional) Filter to a category or condition using the <strong>Filter</strong> button before exporting.</li>
                  <li>Click the <strong>⋯</strong> menu → <strong>Export data as CSV</strong>.</li>
                  <li>Save as <code>gear-inventory-YYYY-MM-DD.csv</code>.</li>
                  <li>For usage history, repeat with the <code>gear_events</code> table and save as <code>gear-usage-YYYY-MM-DD.csv</code>.</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Custom export (specific columns or joins)</p>
                <ol className="space-y-1 pl-4 list-decimal list-inside">
                  <li>Open Supabase → <strong>SQL Editor</strong>.</li>
                  <li>Write a <code>SELECT</code> query (e.g. join <code>aar_reports</code> with <code>events</code>).</li>
                  <li>Run it, then click <strong>Download CSV</strong> on the results panel.</li>
                </ol>
              </div>
              <p className="italic">Open the CSV in Google Sheets or Excel. UTF-8 is preserved, so names and notes render correctly.</p>
            </CardContent>
          </Card>
        </ScrollReveal>

        {dev && (
        <ScrollReveal variant="fade-up" delay={280}>
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
        )}
      </div>
    </MainLayout>
  );
};

export default DeveloperNotes;
