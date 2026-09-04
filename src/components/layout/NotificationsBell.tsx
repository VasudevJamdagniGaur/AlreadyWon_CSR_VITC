"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
};

export function NotificationsBell({ initialCount = 0 }: { initialCount?: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [unread, setUnread] = useState(initialCount);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUnread(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function loadNotifications() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to load notifications.");
        return;
      }
      const list = (json.notifications || []).map(
        (n: {
          id: string;
          title: string;
          message: string;
          type: string;
          createdAt: string | Date;
          isRead: boolean;
        }) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          createdAt:
            typeof n.createdAt === "string"
              ? n.createdAt
              : new Date(n.createdAt).toISOString(),
          isRead: n.isRead,
        })
      ) as NotificationItem[];
      setItems(list);
      setUnread(list.filter((n) => !n.isRead).length);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadNotifications();
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setItems((prev) => (prev ? prev.map((n) => ({ ...n, isRead: true })) : prev));
      setUnread(0);
    } catch {
      // keep panel open; silent fail for demo UX
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => void toggle()}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <Badge
            className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]"
            variant="destructive"
          >
            {unread}
          </Badge>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="glass-panel-strong absolute right-0 top-full z-50 mt-2 w-[min(92vw,22rem)] rounded-2xl p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-cyan-50">Notifications</p>
              <p className="text-xs text-muted-foreground">Recent KellyOS alerts</p>
            </div>
            {items && items.some((n) => !n.isRead) && (
              <Button type="button" variant="ghost" size="sm" onClick={() => void markAllRead()}>
                Mark all read
              </Button>
            )}
          </div>

          {loading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          )}
          {error && !loading && (
            <p className="py-6 text-center text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && items && items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No notifications.</p>
          )}
          {!loading && !error && items && items.length > 0 && (
            <ul className="max-h-80 space-y-0 overflow-y-auto divide-y divide-cyan-400/10">
              {items.map((n) => (
                <li key={n.id} className="py-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-cyan-50">{n.title}</p>
                    {!n.isRead && <Badge variant="info">New</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
