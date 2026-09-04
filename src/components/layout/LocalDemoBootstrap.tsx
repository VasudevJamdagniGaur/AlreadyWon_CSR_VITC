"use client";

import { useEffect } from "react";
import { getLocalDemoProjects, isLocalDemoMode } from "@/lib/localDemoStore";

/**
 * Seeds kellyos_demo_projects in localStorage once (client-only).
 * Does not overwrite existing localStorage on refresh.
 */
export function LocalDemoBootstrap() {
  useEffect(() => {
    if (!isLocalDemoMode()) return;
    getLocalDemoProjects();
  }, []);

  return null;
}
