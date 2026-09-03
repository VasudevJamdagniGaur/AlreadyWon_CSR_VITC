"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Scale,
  Building2,
  GitCompare,
  Wallet,
  Activity,
  BarChart3,
  Settings,
  Menu,
  X,
  Sparkles,
  Handshake,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard#available-csrs", label: "Available CSRs", icon: Handshake },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/prioritization", label: "Prioritize", icon: Scale },
  { href: "/ngos", label: "NGO Intelligence", icon: Building2 },
  { href: "/matching", label: "NGO Matching", icon: GitCompare },
  { href: "/allocation", label: "Fund Allocation", icon: Wallet },
  { href: "/monitoring", label: "Monitoring", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<{ name: string; email: string }>({
    name: "CSR Manager",
    email: "demo@kellyos.ai",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.user?.name && data?.user?.email) {
          setAccount({ name: data.user.name, email: data.user.email });
        } else if (!cancelled && data?.name && data?.email) {
          setAccount({ name: data.name, email: data.email });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const NavContent = () => (
    <>
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" className="block" onClick={() => setOpen(false)}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-white">KELLYOS</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-navy-300">
                AI CSR Intelligence
              </p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const pathOnly = item.href.split("#")[0];
          const hasHash = item.href.includes("#");
          const active =
            !hasHash &&
            (pathname === pathOnly ||
              (pathOnly !== "/dashboard" && pathname.startsWith(pathOnly + "/")));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-navy-200 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <Link
          href="/profile"
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/profile"
              ? "bg-white/10 text-white"
              : "text-navy-200 hover:bg-white/5 hover:text-white"
          )}
        >
          <UserRound className="h-4 w-4" />
          Profile
        </Link>
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-white/10 text-white"
              : "text-navy-200 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Link
          href="/profile"
          onClick={() => setOpen(false)}
          className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-600 text-xs font-semibold text-white">
            {initials(account.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{account.name}</p>
            <p className="truncate text-xs text-navy-300">{account.email}</p>
          </div>
        </Link>
      </div>
    </>
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-950 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
