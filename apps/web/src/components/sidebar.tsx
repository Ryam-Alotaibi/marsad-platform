"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BoltIcon,
  ShieldIcon,
  MapIcon,
  SensorIcon,
  EnergyIcon,
  ChatIcon,
  GaugeIcon,
  HeadsetIcon,
  SlidersIcon,
  BookIcon,
  NetworkIcon,
  RadarIcon,
  ShieldCheckIcon,
  ClipboardListIcon,
  InfoIcon,
} from "@/components/nav-icons";
import { CloudIcon } from "@/components/stat-icons";
import { BrandMark } from "@/components/brand-mark";
import { useSession } from "@/lib/session-context";
import { t } from "@/i18n/t";

interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "نظرة عامة",
    items: [
      { href: "/dashboard", label: "الرئيسية", icon: HomeIcon },
      { href: "/dashboard/systems", label: "لوحة التحكم التفصيلية", icon: GaugeIcon },
    ],
  },
  {
    label: "المراقبة والتنبؤ",
    items: [
      { href: "/dashboard/predictions", label: "التنبؤ الذكي العاجل", icon: BoltIcon },
      { href: "/dashboard/alerts", label: "التنبيهات والمخاطر", icon: ShieldIcon },
      { href: "/dashboard/maps/power", label: "الخرائط التفاعلية", icon: MapIcon },
      { href: "/dashboard/environment", label: "المخاطر البيئية", icon: CloudIcon },
      { href: "/dashboard/sensors", label: "مستشعرات IoT", icon: SensorIcon },
      { href: "/dashboard/advisor", label: "المستشار الذكي", icon: ChatIcon },
    ],
  },
  {
    label: "التشغيل والدعم",
    items: [
      { href: "/dashboard/energy", label: "ترشيد الطاقة", icon: EnergyIcon },
      { href: "/dashboard/support", label: "الدعم الفني", icon: HeadsetIcon },
      { href: "/dashboard/preferences", label: "تنبيهات مخصصة", icon: SlidersIcon },
      { href: "/dashboard/continuity", label: "استمرارية الخدمة", icon: ShieldCheckIcon },
    ],
  },
  {
    label: "الأنظمة المتقدمة",
    items: [
      { href: "/dashboard/federated", label: "شبكة مرصاد الاتحادي", icon: NetworkIcon },
      { href: "/dashboard/future", label: "مرصاد المستقبل", icon: RadarIcon },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { href: "/dashboard/about", label: "عن النظام", icon: InfoIcon },
      { href: "/dashboard/guide", label: "دليل المستخدم", icon: BookIcon },
      { href: "/dashboard/audit-log", label: "سجل التدقيق", icon: ClipboardListIcon, adminOnly: true },
    ],
  },
];

const ADMIN_ONLY_ROLES = new Set(["TENANT_ADMIN", "SUPER_ADMIN"]);

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();
  const isAdmin = ADMIN_ONLY_ROLES.has(user.roleKey);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-e border-border-subtle bg-raised">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <BrandMark className="h-7 w-7 text-[var(--brand-gold)]" />
        <span className="text-base font-semibold text-text-primary">{t("app.name")}</span>
      </div>
      <div className="mx-5 h-px bg-border-subtle" />

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (items.length === 0) return null;

          return (
            <div key={group.label} className="flex flex-col gap-0.5">
              <span className="px-3 pb-1.5 text-[11px] font-semibold tracking-wide text-text-tertiary">
                {group.label}
              </span>
              {items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sunken text-text-primary"
                        : "text-text-secondary hover:bg-sunken/60 hover:text-text-primary"
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-1 end-0 w-0.5 rounded-full"
                        style={{ background: "var(--brand-gold)" }}
                      />
                    )}
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
