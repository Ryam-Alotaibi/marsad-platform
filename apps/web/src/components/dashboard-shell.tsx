"use client";

import type { ReactNode, CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/lib/sidebar-context";

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
      <SidebarProvider>
        <Sidebar />
        <div key={pathname} className="page-enter flex min-w-0 flex-1 flex-col bg-canvas">
          {children}
        </div>
      </SidebarProvider>
    </div>
  );
}
