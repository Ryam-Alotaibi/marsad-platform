"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchOverview, type OverviewResponse } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { Topbar } from "@/components/topbar";
import { BrandMark } from "@/components/brand-mark";
import { StatCard } from "@/components/stat-card";
import { ActivityIcon, PulseIcon, CloudIcon, ThermometerIcon } from "@/components/stat-icons";
import { BoltIcon, ShieldIcon, MapIcon, ChatIcon } from "@/components/nav-icons";
import { RISK_FACTOR_LABELS_AR } from "@marsad/shared";
import { t } from "@/i18n/t";

function healthTone(pct: number) {
  if (pct >= 70) return "success" as const;
  if (pct >= 40) return "warning" as const;
  return "danger" as const;
}

function riskTone(pct: number) {
  if (pct <= 30) return "success" as const;
  if (pct <= 60) return "warning" as const;
  return "danger" as const;
}

const QUICK_LINKS = [
  { href: "/dashboard/predictions", label: "التنبؤ الذكي العاجل", desc: "التنبؤات النشطة وإجراءاتها", icon: BoltIcon },
  { href: "/dashboard/alerts", label: "التنبيهات والمخاطر", desc: "التنبيهات المفتوحة حسب الخطورة", icon: ShieldIcon },
  { href: "/dashboard/maps/power", label: "الخرائط التفاعلية", desc: "الكهرباء والاتصالات والمخاطر", icon: MapIcon },
  { href: "/dashboard/advisor", label: "المستشار الذكي", desc: "استفسار مباشر ببيانات حقيقية", icon: ChatIcon },
];

export default function DashboardHomePage() {
  const { tenant } = useSession();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);

  useEffect(() => {
    fetchOverview().then(setOverview);
  }, []);

  return (
    <>
      <Topbar title="الرئيسية" />
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6">
          <section className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-raised px-4 py-4 shadow-card sm:gap-4 sm:px-6 sm:py-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-brand text-[var(--brand-gold)] sm:h-11 sm:w-11">
              <BrandMark className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-tertiary">{t("app.name")} · {t("app.tagline")}</p>
              <h1 className="mt-1 text-lg font-semibold text-text-primary sm:text-xl">{tenant.nameAr}</h1>
            </div>
          </section>

          {overview && (
            <>
              <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard
                  label={t("dashboard.activeSystems")}
                  value={String(overview.activeSystemsCount)}
                  icon={<ActivityIcon className="h-5 w-5" />}
                  tone="brand"
                />
                <StatCard
                  label={t("dashboard.systemHealth")}
                  value={`${overview.systemHealthPct}%`}
                  icon={<PulseIcon className="h-5 w-5" />}
                  tone={healthTone(overview.systemHealthPct)}
                />
                <StatCard
                  label={t("dashboard.weatherRisk")}
                  value={`${overview.weatherRiskPct}%`}
                  icon={<CloudIcon className="h-5 w-5" />}
                  tone={riskTone(overview.weatherRiskPct)}
                />
                <StatCard
                  label={t("dashboard.currentTemp")}
                  value={overview.currentTempC !== null ? `${overview.currentTempC.toFixed(1)}°` : "—"}
                  icon={<ThermometerIcon className="h-5 w-5" />}
                  tone="brand"
                />
              </section>

              <section>
                <h2 className="mb-3 text-sm font-semibold text-text-primary">تنقّل سريع</h2>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {QUICK_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-border-subtle bg-raised p-4 shadow-card transition-colors hover:border-brand/40"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-brand/10 text-brand">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary group-hover:text-brand">{link.label}</p>
                          <p className="mt-0.5 text-xs text-text-tertiary">{link.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="text-sm font-semibold text-text-primary">
                  {t("dashboard.externalFactorsTitle")}
                </h2>
                {overview.externalFactors.length === 0 ? (
                  <p className="mt-3 text-sm text-text-tertiary">{t("dashboard.noData")}</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {overview.externalFactors.map((factor) => (
                      <li key={factor.factorType} className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${Math.min(100, factor.impactPct)}%` }}
                          />
                        </div>
                        <div className="w-14 shrink-0 text-end text-sm font-medium text-text-primary">
                          {factor.impactPct}%
                        </div>
                        <div className="w-40 shrink-0 text-sm text-text-secondary">
                          {factor.factorType === "WEATHER"
                            ? "الطقس"
                            : (RISK_FACTOR_LABELS_AR[factor.factorType] ?? factor.factorType)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="text-sm font-semibold text-text-primary">
                  {t("dashboard.telecomStatusTitle")}
                </h2>
                {overview.telecomStatus.length === 0 ? (
                  <p className="mt-3 text-sm text-text-tertiary">{t("dashboard.noData")}</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle text-start text-xs text-text-tertiary">
                          <th className="pb-2 text-start font-medium">مزود الاتصالات</th>
                          <th className="pb-2 text-start font-medium">الحالة</th>
                          <th className="pb-2 text-start font-medium">{t("dashboard.telecomLatency")}</th>
                          <th className="pb-2 text-start font-medium">{t("dashboard.telecomUptime")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.telecomStatus.map((row) => (
                          <tr key={row.providerName} className="border-b border-border-subtle last:border-0">
                            <td className="py-2.5 text-text-primary">{row.providerName}</td>
                            <td className="py-2.5 text-text-secondary">{row.status}</td>
                            <td className="py-2.5 text-text-secondary" dir="ltr">
                              {row.latencyMs} ms
                            </td>
                            <td className="py-2.5 text-text-secondary" dir="ltr">
                              {row.uptimePct}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
