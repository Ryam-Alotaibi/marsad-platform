import type { ReactNode } from "react";
import { Topbar } from "@/components/topbar";
import { MapTabs } from "@/components/map-tabs";

export function MapPageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Topbar title="الخرائط التفاعلية" />
      <MapTabs />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">{children}</div>
      </main>
    </>
  );
}
