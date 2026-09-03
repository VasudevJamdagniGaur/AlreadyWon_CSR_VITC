import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading search…</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
