import { supabase } from "@/integrations/supabase/client";
import { getCurrentCode, getCurrentRole } from "@/lib/auth";

export type ProgrammeMutationFailure = { id: string; message: string };

export type DeleteProgrammesResult = {
  deletedCount: number;
  failed: ProgrammeMutationFailure[];
};

/**
 * Removes programmes via Edge Function when an invite access code exists (usual path).
 * Fallback: authenticated Supabase user with a non‑Member tpac_user_role uses direct DELETE (RLS).
 * Per-id operations so mixed success/failure is reported without aborting the whole batch.
 */
export async function deleteProgrammes(eventIds: string[]): Promise<DeleteProgrammesResult> {
  const trimmedIds = [...new Set(eventIds.map((id) => id.trim()).filter(Boolean))];
  if (!trimmedIds.length) throw new Error("Nothing to delete");

  const mapFailed = (
    rows: { id: string; error: string }[] | undefined | null,
  ): ProgrammeMutationFailure[] =>
    (rows ?? []).map((r) => ({ id: r.id, message: r.error }));

  const accessCode = getCurrentCode();

  if (accessCode) {
    const { data, error } = await supabase.functions.invoke("delete-event", {
      body: { accessCode, eventIds: trimmedIds },
    });
    if (error) throw error;
    const payload = data as {
      success?: boolean;
      error?: string;
      deletedCount?: number;
      failed?: { id: string; error: string }[];
    } | null;
    if (!payload?.success) {
      throw new Error(payload?.error ?? "Failed to delete programme(s)");
    }
    return {
      deletedCount: payload.deletedCount ?? 0,
      failed: mapFailed(payload.failed),
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error(
      "Missing invite verification. Re-open the platform and enter your access code, then try again.",
    );
  }

  const role = getCurrentRole();
  if (!role || role === "Member") {
    throw new Error("Members cannot delete programmes.");
  }

  const failed: ProgrammeMutationFailure[] = [];
  let deletedCount = 0;

  for (const id of trimmedIds) {
    const { error: delErr } = await supabase.from("events").delete().eq("id", id);
    if (delErr) failed.push({ id, message: delErr.message });
    else deletedCount++;
  }

  return { deletedCount, failed };
}
