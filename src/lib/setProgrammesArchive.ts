import { supabase } from "@/integrations/supabase/client";
import { getCurrentCode } from "@/lib/auth";

export type ProgrammeMutationFailure = { id: string; message: string };

export type SetProgrammesArchiveResult = {
  updatedCount: number;
  failed: ProgrammeMutationFailure[];
};

/**
 * Archive or restore programmes via Edge Function when an invite access code exists.
 * Fallback: authenticated Supabase session uses direct UPDATE (creator-owned rows only via RLS).
 */
export async function setProgrammesArchived(
  eventIds: string[],
  archive: boolean,
): Promise<SetProgrammesArchiveResult> {
  const trimmedIds = [...new Set(eventIds.map((id) => id.trim()).filter(Boolean))];
  if (!trimmedIds.length) throw new Error("No programmes selected");

  const mapFailed = (
    rows: { id: string; error: string }[] | undefined | null,
  ): ProgrammeMutationFailure[] =>
    (rows ?? []).map((r) => ({ id: r.id, message: r.error }));

  const accessCode = getCurrentCode();

  if (accessCode) {
    const { data, error } = await supabase.functions.invoke("archive-events", {
      body: { accessCode, eventIds: trimmedIds, archive },
    });
    if (error) throw error;
    const payload = data as {
      success?: boolean;
      error?: string;
      updatedCount?: number;
      failed?: { id: string; error: string }[];
    } | null;
    if (!payload?.success) {
      throw new Error(payload?.error ?? "Failed to update programme archive state");
    }
    return {
      updatedCount: payload.updatedCount ?? 0,
      failed: mapFailed(payload.failed),
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error(
      "Missing invite verification. Re-open the platform and enter your access code, then try again.",
    );
  }

  const archived_at = archive ? new Date().toISOString() : null;

  const failed: ProgrammeMutationFailure[] = [];
  let updatedCount = 0;

  for (const id of trimmedIds) {
    const { error } = await supabase
      .from("events")
      .update({ archived_at })
      .eq("id", id);
    if (error) failed.push({ id, message: error.message });
    else updatedCount++;
  }

  return { updatedCount, failed };
}
