"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/maps/power", label: "الكهرباء" },
  { href: "/dashboard/maps/telecom", label: "الاتصالات" },
  { href: "/dashboard/maps/risk", label: "المخاطر" },
  { href: "/dashboard/maps/weather", label: "الطقس" },
];

export function MapTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-border-subtle px-6">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-brand text-brand"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
