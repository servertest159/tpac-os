/** User-facing hint when Postgres rejects a change due to related rows still linked. */
export function foreignKeyViolationMessage(error: unknown): string | undefined {
  const raw =
    error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
  if (/\b23503\b/i.test(raw) || /foreign key/i.test(raw) || /violates foreign key/i.test(raw)) {
    return "Another record still depends on this (for example gear still assigned). Unlink assignments or dependent rows first, then try again.";
  }
  return undefined;
}
