"use client";

import type { ReactNode, CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { Sidebar } from "@/components/sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { tenant } = useSession();
  const pathname = usePathname();

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
      <div key={pathname} className="page-enter flex flex-1 flex-col bg-canvas">
        {children}
      </div>
    </div>
  );
}
