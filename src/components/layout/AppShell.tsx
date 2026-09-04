"use client";

import { useEffect, useRef } from "react";
import { useShellMeta } from "@/components/layout/AppChrome";

/**
 * Page-level shell adapter. Chrome (sidebar/topbar) lives in the app layout
 * so it stays mounted across navigations; pages only update breadcrumbs/meta.
 */
export function AppShell({
  children,
  breadcrumbs = [],
  notificationCount = 0,
}: {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  notificationCount?: number;
}) {
  const { setMeta } = useShellMeta();
  const metaKey = `${notificationCount}|${breadcrumbs
    .map((b) => `${b.label}:${b.href ?? ""}`)
    .join(",")}`;
  const lastKey = useRef("");

  useEffect(() => {
    if (lastKey.current === metaKey) return;
    lastKey.current = metaKey;
    setMeta({ breadcrumbs, notificationCount });
  }, [metaKey, breadcrumbs, notificationCount, setMeta]);

  return <>{children}</>;
}
