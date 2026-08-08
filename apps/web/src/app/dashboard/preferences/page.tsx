"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session-context";
import {
  fetchMyAlertPreference,
  updateMyAlertPreference,
  fetchRegions,
  fetchCategorySummary,
  fetchEscalationRules,
  type AlertPreference,
  type RegionOption,
  type CategorySummaryRow,
  type EscalationRule,
} from "@/lib/api";
import { Topbar } from "@/components/topbar";
import {
  NOTIFICATION_CHANNEL_LABELS_AR,
  ALERT_CATEGORY_LABELS_AR,
  ROLE_LABELS_AR,
  ROLE_SCOPE_AR,
  DEFAULT_ROLE_KEYS,
  type RoleKey,
} from "@marsad/shared";

const CHANNELS = ["PUSH", "EMAIL", "SMS", "WHATSAPP", "VOICE_CALL"];

const THRESHOLD_CONFIG = [
  { key: "TEMPERATURE", label: "درجة الحرارة", unit: "°C", min: 20, max: 50 },
  { key: "HUMIDITY", label: "الرطوبة", unit: "%", min: 0, max: 100 },
  { key: "AQI", label: "جودة الهواء (AQI)", unit: "", min: 0, max: 200 },
  { key: "CO2", label: "ثاني أكسيد الكربون", unit: "ppm", min: 400, max: 2000 },
];

export default function PreferencesPage() {
  const { user } = useSession();
  const [preference, setPreference] = useState<AlertPreference | null>(null);
  const [regions, setRegions] = useState<RegionOption[] | null>(null);
  const [summary, setSummary] = useState<CategorySummaryRow[] | null>(null);
  const [rules, setRules] = useState<EscalationRule[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const userRoleKey = (user.roleKey as RoleKey) ?? "EMPLOYEE";
  const [viewRole, setViewRole] = useState<RoleKey>(userRoleKey);

  useEffect(() => {
    fetchMyAlertPreference().then(setPreference);
    fetchRegions().then(setRegions);
    fetchCategorySummary().then(setSummary);
    fetchEscalationRules().then(setRules);
  }, []);

  const matchingRules = rules?.filter((r) => r.notifyRoles.includes(viewRole)) ?? [];

  function toggleChannel(channel: string) {
    if (!preference) return;
    setSaved(false);
    const channels = preference.channels.includes(channel)
      ? preference.channels.filter((c) => c !== channel)
      : [...preference.channels, channel];
    setPreference({ ...preference, channels });
  }

  function toggleRegion(regionId: string) {
    if (!preference) return;
    setSaved(false);
    const watchedRegionIds = preference.watchedRegionIds.includes(regionId)
      ? preference.watchedRegionIds.filter((r) => r !== regionId)
      : [...preference.watchedRegionIds, regionId];
    setPreference({ ...preference, watchedRegionIds });
  }

  function updateThreshold(key: string, value: number) {
    if (!preference) return;
    setSaved(false);
    setPreference({ ...preference, thresholds: { ...preference.thresholds, [key]: value } });
  }

  async function handleSave() {
    if (!preference) return;
    setSaving(true);
    try {
      const updated = await updateMyAlertPreference({
        channels: preference.channels,
        thresholds: preference.thresholds,
        watchedRegionIds: preference.watchedRegionIds,
      });
      setPreference(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Topbar title="تنبيهات مخصصة" />
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {preference && (
            <>
              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-primary">اختر دورك</h2>
                  {viewRole !== userRoleKey && (
                    <button
                      onClick={() => setViewRole(userRoleKey)}
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      الرجوع لدوري الفعلي
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_ROLE_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => setViewRole(key)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        viewRole === key
                          ? "bg-brand text-white"
                          : "bg-sunken text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {ROLE_LABELS_AR[key]}
                      {key === userRoleKey && (
                        <span className={viewRole === key ? "text-white/70" : "text-text-tertiary"}> · دورك</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-[var(--radius-md)] border border-border-subtle bg-sunken p-3.5">
                  <p className="text-sm font-medium text-text-primary">{ROLE_LABELS_AR[viewRole]}</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{ROLE_SCOPE_AR[viewRole]}</p>
                  <p className="mt-2.5 text-xs text-text-tertiary">
                    {matchingRules.length === 0
                      ? "هذا الدور غير مُدرَج حاليًا في مصفوفة التصعيد الزمنية."
                      : `يستقبل هذا الدور إشعارات التصعيد عند: ${matchingRules
                          .map((r) => (r.delayMinutes === 0 ? `المستوى ${r.level} (فوري)` : `المستوى ${r.level} (بعد ${r.delayMinutes} دقيقة)`))
                          .join("، ")}.`}
                  </p>
                </div>

                {viewRole !== userRoleKey && (
                  <p className="mt-3 text-[11px] text-text-tertiary">
                    القنوات والعتبات والمناطق أدناه تخص تفضيلاتك الشخصية فقط ({ROLE_LABELS_AR[userRoleKey]})، ولا تتغيّر باختيار دور آخر هنا.
                  </p>
                )}
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">قنوات الإشعار المفعّلة</h2>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((channel) => (
                    <button
                      key={channel}
                      onClick={() => toggleChannel(channel)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        preference.channels.includes(channel)
                          ? "bg-brand text-white"
                          : "bg-sunken text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {NOTIFICATION_CHANNEL_LABELS_AR[channel]}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">عتبات التنبيه</h2>
                <div className="flex flex-col gap-5">
                  {THRESHOLD_CONFIG.map((cfg) => (
                    <div key={cfg.key}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-text-primary">{cfg.label}</span>
                        <span
                          className="rounded-[3px] bg-brand/10 px-2 py-0.5 font-mono text-xs font-medium text-brand"
                          dir="ltr"
                        >
                          {preference.thresholds[cfg.key] ?? cfg.max} {cfg.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={cfg.min}
                        max={cfg.max}
                        value={preference.thresholds[cfg.key] ?? cfg.max}
                        onChange={(e) => updateThreshold(cfg.key, Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sunken accent-[var(--brand-gold)]"
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">المناطق الجغرافية المتابَعة</h2>
                <div className="flex flex-wrap gap-2">
                  {regions?.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => toggleRegion(region.id)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        preference.watchedRegionIds.includes(region.id)
                          ? "bg-brand text-white"
                          : "bg-sunken text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {region.name}
                    </button>
                  ))}
                  {regions?.length === 0 && <p className="text-sm text-text-tertiary">لا توجد مناطق مسجّلة.</p>}
                </div>
              </section>

              <button
                onClick={handleSave}
                disabled={saving}
                className="self-start rounded-[var(--radius-sm)] bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "جارٍ الحفظ..." : saved ? "تم الحفظ" : "حفظ التفضيلات"}
              </button>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">ملخص التنبيهات حسب الفئة</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-start text-xs text-text-tertiary">
                        <th className="pb-2 text-start font-medium">الفئة</th>
                        <th className="pb-2 text-start font-medium">التنبيهات المفتوحة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary?.map((row) => (
                        <tr key={row.category} className="border-b border-border-subtle last:border-0">
                          <td className="py-2.5 text-text-primary">{ALERT_CATEGORY_LABELS_AR[row.category]}</td>
                          <td className="py-2.5 text-text-secondary" dir="ltr">
                            {row.openCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
