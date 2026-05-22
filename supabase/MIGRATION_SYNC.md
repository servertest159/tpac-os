# Fixing “Remote migration versions not found in local migrations directory”

Your **hosted** Postgres has rows in `supabase_migrations.schema_migrations` for versions that do **not** have a matching file under `supabase/migrations/` in this repo (for example `20250605125719`, which is **older** than our earliest checked-in migration `20250615104031`). The CLI refuses `db push` until local files and remote history match.

## Before you change anything

1. **Back up** the production project (Supabase Dashboard → Database → Backups, or dump).
2. Prefer doing this on a **staging** branch DB first if you use branching.

## Option A — Follow the CLI (`migration repair`) [most common]

When `supabase db push` fails, it usually prints a suggested command like:

```bash
supabase migration repair --status reverted <VERSION> <VERSION> ...
```

- **`--status reverted`** removes those version rows from the **remote** migration history table. It does **not** roll back schema by itself; it only fixes the bookkeeping.
- Use the **exact version list** from your terminal output (copy–paste the whole command).

Then:

```bash
supabase db pull
```

to pull the current remote schema into a new migration if the CLI still recommends it, and try:

```bash
supabase db push
```

again.

**When this is appropriate:** the “missing” versions are from an old machine, Lovable, Dashboard SQL, or a deleted branch of the repo, and the **live schema** is already what you want—only the migration table is wrong.

**Risk:** if someone later relies on that history for ordering, you’ve simplified it. Mitigate with backups and team agreement.

## Option B — Restore the real SQL files

If another machine or teammate still has the `.sql` files for those versions, **add them to `supabase/migrations/`** with names:

`YYYYMMDDHHMMSS_short_description.sql`

(14-digit timestamp, underscore, then a name—no `timestamp-.sql` or `timestamp-uuid.sql` only patterns.)

Then `db push` can reconcile without deleting remote history.

## Option C — Inspect remote vs local

**Remote (Dashboard → SQL editor):**

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;
```

**Local (PowerShell):**

```powershell
.\supabase\scripts\list-local-migration-versions.ps1
```

Every `version` present on the remote must either have a local file with that **same** 14-digit prefix, or be removed via **`migration repair --status reverted`** (Option A).

## Notes

- **`supabase db reset`** reapplies migrations to the **local** stack only; it does **not** fix hosted history.
- Our repo normalizes filenames to `*_name.sql` so the CLI stops **skipping** files; the error you see now is specifically **extra** versions on the remote.
