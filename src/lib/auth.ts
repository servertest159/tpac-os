// Centralised helpers for the custom AccessGate auth.
// The role lives in localStorage and is set during sign-in.

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
  return !!role && role !== "Member";
};

export const signOut = () => {
  localStorage.removeItem("tpac_access_granted");
  localStorage.removeItem("tpac_user_role");
  localStorage.removeItem("tpac_access_code");
  localStorage.removeItem("tpac_holder_name");
  window.location.href = "/";
};
