import { supabase } from "@/integrations/supabase/client";
import { getCurrentCode } from "@/lib/auth";

/**
 * Archive or restore programmes via Edge Function when an invite access code exists.
 * Fallback: authenticated Supabase session uses direct UPDATE (creator-owned rows only via RLS).
 */
export async function setProgrammesArchived(
  eventIds: string[],
  archive: boolean,
): Promise<{ updatedCount: number }> {
  const trimmedIds = [...new Set(eventIds.map((id) => id.trim()).filter(Boolean))];
  if (!trimmedIds.length) throw new Error("No programmes selected");

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
    } | null;
    if (!payload?.success) {
      throw new Error(payload?.error ?? "Failed to update programme archive state");
    }
    return { updatedCount: payload.updatedCount ?? trimmedIds.length };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error(
      "Missing invite verification. Re-open the platform and enter your access code, then try again.",
    );
  }

  const { error } = await supabase
    .from("events")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .in("id", trimmedIds);

  if (error) throw error;

  return { updatedCount: trimmedIds.length };
}
