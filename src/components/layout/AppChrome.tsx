"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

type ShellMeta = {
  breadcrumbs: { label: string; href?: string }[];
  notificationCount: number;
};

type ShellContextValue = {
  setMeta: (meta: Partial<ShellMeta>) => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShellMeta() {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error("useShellMeta must be used within AppChrome");
  }
  return ctx;
}

export function AppChrome({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<ShellMeta>({
    breadcrumbs: [],
    notificationCount: 0,
  });

  const setMeta = useCallback((patch: Partial<ShellMeta>) => {
    setMetaState((prev) => ({
      breadcrumbs: patch.breadcrumbs ?? prev.breadcrumbs,
      notificationCount:
        patch.notificationCount !== undefined
          ? patch.notificationCount
          : prev.notificationCount,
    }));
  }, []);

  const value = useMemo(() => ({ setMeta }), [setMeta]);

  return (
    <ShellContext.Provider value={value}>
      <div className="min-h-screen bg-transparent">
        <Sidebar />
        <div className="lg:pl-64">
          <TopBar
            breadcrumbs={meta.breadcrumbs}
            notificationCount={meta.notificationCount}
          />
          <main className="p-4 lg:p-6">{children}</main>
          <footer className="border-t border-white/10 bg-white/[0.03] px-6 py-3 text-center text-xs text-white/55 backdrop-blur-md">
            KellyOS — AI-Powered CSR Decision & Project Intelligence
          </footer>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
