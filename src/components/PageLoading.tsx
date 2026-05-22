/** Fallback for lazy‑loaded routes. */
export default function PageLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground text-sm"
    >
      <span className="h-10 w-10 rounded-full border-2 border-muted border-t-primary motion-safe:animate-spin" aria-hidden />
      <span>Loading…</span>
    </div>
  );
}
