"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyPlaceholder } from "@/components/shared/EmptyPlaceholder";
import { Search } from "lucide-react";

type Hit = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  score: number;
};

export default function SearchPageClient() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  async function runSearch(query: string) {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initial) runSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <AppShell breadcrumbs={[{ label: "Search" }]}>
      <h1 className="text-2xl font-semibold text-cyan-50">Search</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search projects, NGOs, documents, and recommendations.
      </p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(q);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Sunrise, Seva, education, Haryana"
            aria-label="Search KellyOS"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      <div className="mt-6 space-y-3">
        {!loading && results.length === 0 && q && (
          <EmptyPlaceholder
            title="No matches"
            description="Try another project name, NGO, or theme keyword."
          />
        )}
        {results.map((r) => (
          <Card key={`${r.type}-${r.id}`} className="transition hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">
                <Link href={r.href} className="hover:underline">
                  {r.title}
                </Link>
              </CardTitle>
              <Badge variant="outline">{r.type}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {r.subtitle}
              <span className="ml-2 text-xs">· relevance {(r.score * 100).toFixed(0)}%</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
