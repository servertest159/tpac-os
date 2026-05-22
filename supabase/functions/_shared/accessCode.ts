import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

export type ResolvedAccess =
  | { ok: true; id: string; role: string }
  | { ok: false; error: string };

export const DEVELOPER_ACCESS_CODE = "111111";
export const MEMBER_ROLE_LABEL = "Member";

export function canMutateOperationalData(role: string): boolean {
  return role !== MEMBER_ROLE_LABEL;
}

/**
 * Resolve invite code via public.access_codes (single source of truth).
 * Mirrors AccessGate.tsx rules: active flag + optional expiry.
 */
export async function resolveAccessCodeRole(
  supabase: SupabaseClient,
  accessCode: string | number | null | undefined,
): Promise<ResolvedAccess> {
  const codeKey = String(accessCode ?? "").trim();
  if (!codeKey) {
    return { ok: false, error: "Missing access code" };
  }

  // Maintainer parity with the SPA: developer keeps backend access even if the seed row is absent.
  if (codeKey === DEVELOPER_ACCESS_CODE) {
    return { ok: true, id: "developer", role: "Developer" };
  }

  const { data, error } = await supabase
    .from("access_codes")
    .select("id, code, role, active, expires_at")
    .eq("code", codeKey)
    .maybeSingle();

  if (error) {
    console.error("resolveAccessCodeRole:", error);
    return { ok: false, error: "Could not verify access code" };
  }

  if (!data) {
    return { ok: false, error: "Invalid access code" };
  }

  if (!data.active) {
    return {
      ok: false,
      error:
        "This code has been deactivated. Request a new one from your committee lead.",
    };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return {
      ok: false,
      error: "This code has expired. Request a renewed code from your committee lead.",
    };
  }

  return { ok: true, id: data.id, role: data.role };
}
