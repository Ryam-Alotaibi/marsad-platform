"use client";

import type { ReactNode, CSSProperties } from "react";
import { useSession } from "@/lib/session-context";
import { Sidebar } from "@/components/sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { tenant } = useSession();

  return (
    <div
      className="flex flex-1"
      style={
        {
          "--brand-primary": tenant.primaryColor,
          "--brand-secondary": tenant.secondaryColor,
        } as CSSProperties
      }
    >
      <Sidebar />
      <div className="flex flex-1 flex-col bg-canvas">{children}</div>
    </div>
  );
}
