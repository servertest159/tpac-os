# Path to a Low-Maintenance TPAC OS

Goal: shape the product so it can keep running for years without a developer babysitting it. The two levers are (1) removing hardcoded values that age out, and (2) tightening UX so users self-serve instead of asking for fixes.

## Where the system currently needs a human

- **Access codes are hardcoded** in `AccessGate.tsx`. Onboarding a new exec means a code change + redeploy.
- **Roles are hardcoded** in the same file. Each AY hand-over requires editing source.
- **No in-app admin surface** for users, roles, gear categories, or AAR form links — everything lives in code or the Supabase dashboard.
- **No empty/error states with self-service guidance** — when something is wrong the user has to message the developer.
- **No data hygiene tools** — archives grow forever, broken records can't be fixed in-app.
- **No onboarding** — new exec opens the app cold, has nowhere to learn it.

## Plan: 5 workstreams, each independently shippable

### 1. Move auth + roles into the database (one-time)
- New `access_codes` table: `code (text, unique)`, `role`, `holder_name`, `active`, `created_at`, `expires_at`.
- `AccessGate` queries Supabase instead of the hardcoded map.
- New `/admin/access` page (President / VP only): create, rotate, deactivate codes. Bulk-rotate at AY hand-over in one click.
- Result: every future exec change is a 30-second click, not a redeploy.

### 2. Self-service admin console (`/admin`)
One page with tabs, gated by role:
- **Members & roles** — invite by code, change role, deactivate.
- **Gear categories / conditions** — currently hardcoded constants; move to a small `lookup_values` table.
- **AAR form links** — already in DB, just expose CRUD properly.
- **Audit log viewer** — read-only window into `*_audit_log` tables with search + date filter.

### 3. UX guardrails so users don't break things
- **Confirmation + undo toasts** on every destructive action (archive, delete, bulk ops) — 5s undo window using soft-delete that already exists.
- **Empty states with a single clear CTA** on every list (Events, Gear, Feedback, Participants) — "Nothing here yet. [Create your first programme]".
- **Inline validation** on forms (dates, capacity, required roles) instead of failing on submit.
- **Friendly error fallbacks** — wrap every page in an error boundary that shows "Something went wrong. [Retry] [Report]" instead of a white screen.
- **Offline / stale data banner** when Supabase realtime disconnects, with auto-reconnect.

### 4. Built-in onboarding & help
- First-login tour (3-4 steps) using a lightweight library, dismissible, stored per access code.
- Persistent "?" help button → drawer with quick FAQs (How do I archive? How do I export?), pulled from a `help_articles` table so admins can edit content without a deploy.
- Replace the Developer Notes page with a **User Handbook** page in the same slot — same structure, written for executives, editable from admin.

### 5. Long-term data hygiene (automated)
- Auto-archive events 90 days after `end_date` (scheduled edge function, daily).
- Hard-delete archived rows after 2 years (configurable in admin).
- Weekly digest email to President: new submissions, gear nearing maintenance, expired access codes.
- Health-check page at `/admin/health` showing DB row counts, last realtime event, storage usage — so the org notices issues before they become outages.

## Suggested shipping order
1. Workstream 1 (auth/roles in DB) — highest leverage, unblocks future hand-overs.
2. Workstream 3 (UX guardrails) — biggest reduction in "the app is broken" messages.
3. Workstream 2 (admin console) — builds on 1.
4. Workstream 4 (onboarding) — once the app is stable enough to teach.
5. Workstream 5 (automation) — set-and-forget cleanup.

## Technical notes
- All new tables follow the existing custom-auth pattern: RLS policies use `access_codes.role` lookups, not `auth.uid()`.
- Realtime listeners on the new tables so admin changes propagate without refresh, consistent with existing pattern.
- Help/handbook content stored as markdown in DB, rendered with `react-markdown` (already common in the stack).
- Scheduled cleanup runs as a Supabase edge function with `pg_cron`; no external scheduler needed.

## Out of scope (intentionally)
- Mobile app — PWA install banner is enough.
- Migrating off the custom AccessGate to Supabase Auth — would invalidate the current sign-in flow the org is used to.
- Analytics dashboard — separate request if desired later.
