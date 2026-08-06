"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session-context";
import {
  fetchMyAlertPreference,
  updateMyAlertPreference,
  fetchRegions,
  fetchCategorySummary,
  type AlertPreference,
  type RegionOption,
  type CategorySummaryRow,
} from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { NOTIFICATION_CHANNEL_LABELS_AR, ALERT_CATEGORY_LABELS_AR, ROLE_LABELS_AR, type RoleKey } from "@marsad/shared";

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMyAlertPreference().then(setPreference);
    fetchRegions().then(setRegions);
    fetchCategorySummary().then(setSummary);
  }, []);

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
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {preference && (
            <>
              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <p className="text-xs text-text-tertiary">الدور الحالي</p>
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {ROLE_LABELS_AR[user.roleKey as RoleKey] ?? user.roleName}
                </p>
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
