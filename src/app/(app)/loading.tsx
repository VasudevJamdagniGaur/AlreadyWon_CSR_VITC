export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <div className="h-8 w-56 animate-pulse rounded-md bg-slate-200" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-slate-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl border bg-slate-100" />
        <div className="h-40 animate-pulse rounded-xl border bg-slate-100" />
      </div>
      <div className="h-64 animate-pulse rounded-xl border bg-slate-100" />
    </div>
  );
}
