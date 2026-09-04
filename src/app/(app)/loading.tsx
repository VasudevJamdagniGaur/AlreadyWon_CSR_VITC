export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <div className="h-8 w-56 animate-pulse rounded-xl bg-white/15" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded-xl bg-white/10" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="glass-panel h-40 animate-pulse rounded-2xl" />
        <div className="glass-panel h-40 animate-pulse rounded-2xl" />
      </div>
      <div className="glass-panel h-64 animate-pulse rounded-2xl" />
    </div>
  );
}
