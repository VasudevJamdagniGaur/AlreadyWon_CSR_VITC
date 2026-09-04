"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({
  children,
  breadcrumbs,
  notificationCount,
}: {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  notificationCount?: number;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar breadcrumbs={breadcrumbs} notificationCount={notificationCount} />
        <main className="animate-fade-in p-4 lg:p-6">{children}</main>
        <footer className="border-t px-6 py-3 text-center text-xs text-muted-foreground">
          KellyOS — AI-Powered CSR Decision & Project Intelligence
        </footer>
      </div>
    </div>
  );
}
