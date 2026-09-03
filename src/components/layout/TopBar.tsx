"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TopBar({
  breadcrumbs = [],
  notificationCount = 0,
}: {
  breadcrumbs?: { label: string; href?: string }[];
  notificationCount?: number;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/search");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      <div className="ml-12 flex min-w-0 flex-1 items-center gap-4 lg:ml-0">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm md:flex">
            {breadcrumbs.map((b, i) => (
              <span key={b.label} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                {b.href ? (
                  <Link href={b.href} className="text-muted-foreground hover:text-foreground">
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <form onSubmit={onSearch} className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, NGOs, documents..."
            className="h-9 pl-9"
            aria-label="Global search"
          />
        </form>
      </div>
      <Button variant="ghost" size="icon" className="relative" asChild>
        <Link href="/dashboard#notifications" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]"
              variant="destructive"
            >
              {notificationCount}
            </Badge>
          )}
        </Link>
      </Button>
    </header>
  );
}
