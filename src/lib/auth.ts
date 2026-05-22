// Centralised helpers for the custom AccessGate auth.
// The role lives in localStorage and is set during sign-in.

export const TPAC_SESSION_EVENT = "tpac-access-update";

/** Headers / nav can listen to refresh “signed in as” chips after same-tab gate login/logout */
export function emitTpacSessionUpdate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TPAC_SESSION_EVENT));
}

/** Clears Supabase session tokens from browser storage (used before access-gate logout and email-auth flows). */
export function clearSupabaseClientStorage(): void {
  try {
    localStorage.removeItem("supabase.auth.token");
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("supabase.auth.") || key.includes("sb-")) localStorage.removeItem(key);
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith("supabase.auth.") || key.includes("sb-")) sessionStorage.removeItem(key);
    });
  } catch {
    /* ignore */
  }
}

export const ADMIN_ROLES = new Set([
  "President",
  "Vice-President",
  "Honorary Secretary",
  "Honorary Treasurer",
  "Training Head (General)",
  "Training Head (Land)",
  "Training Head (Water)",
  "Training Head (Welfare)",
  "Quartermaster",
  "Publicity Head",
]);

export const SUPER_ADMIN_ROLES = new Set(["President", "Vice-President"]);

/** Invite role that should not manage gear, destructive AAR actions, exports, or codes. */
export const MEMBER_ROLE_LABEL = "Member" as const;

export const getCurrentRole = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("tpac_user_role") : null;

export const getCurrentHolderName = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("tpac_holder_name") : null;

export const getCurrentCode = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("tpac_access_code") : null;

export const isAdmin = (): boolean => {
  const role = getCurrentRole();
  return !!role && ADMIN_ROLES.has(role);
};

export const isSuperAdmin = (): boolean => {
  const role = getCurrentRole();
  return !!role && SUPER_ADMIN_ROLES.has(role);
};

/** Committee / leadership roles may delete programmes; Members cannot. */
export const canDeleteProgrammes = (): boolean => {
  const role = getCurrentRole();
  return !!role && role !== MEMBER_ROLE_LABEL;
};

/**
 * True when the current access-code role may manage operational data: gear CRUD, AAR link/report admin,
 * exports, access codes, and staff roster views (subject to Supabase RLS).
 */
export const canStaffManage = (): boolean => {
  const role = getCurrentRole();
  return !!role && role !== MEMBER_ROLE_LABEL;
};

export const signOut = () => {
  clearSupabaseClientStorage();
  localStorage.removeItem("tpac_access_granted");
  localStorage.removeItem("tpac_user_role");
  localStorage.removeItem("tpac_access_code");
  localStorage.removeItem("tpac_holder_name");
  emitTpacSessionUpdate();
  window.location.href = "/";
};
