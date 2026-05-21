import { supabase } from "@/integrations/supabase/client";
import { getCurrentCode, getCurrentRole } from "@/lib/auth";

/**
 * Removes programmes via Edge Function when an invite access code exists (usual path).
 * Fallback: authenticated Supabase user with a non‑Member tpac_user_role uses direct DELETE (RLS).
 */
export async function deleteProgrammes(eventIds: string[]): Promise<{ deletedCount: number }> {
  const trimmedIds = [...new Set(eventIds.map((id) => id.trim()).filter(Boolean))];
  if (!trimmedIds.length) throw new Error("Nothing to delete");

  const accessCode = getCurrentCode();

  if (accessCode) {
    const { data, error } = await supabase.functions.invoke("delete-event", {
      body: { accessCode, eventIds: trimmedIds },
    });
    if (error) throw error;
    const payload = data as { success?: boolean; error?: string; deletedCount?: number } | null;
    if (!payload?.success) {
      throw new Error(payload?.error ?? "Failed to delete programme(s)");
    }
    return { deletedCount: payload.deletedCount ?? trimmedIds.length };
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

  const { error: delErr } = await supabase.from("events").delete().in("id", trimmedIds);
  if (delErr) throw delErr;

  return { deletedCount: trimmedIds.length };
}
