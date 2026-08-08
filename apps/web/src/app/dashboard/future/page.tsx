"use client";

import { useEffect, useState } from "react";
import {
  runScenario,
  runNightlySweep,
  fetchScenarios,
  freezePlaybook,
  fetchPlaybooks,
  activatePlaybook,
  type ScenarioFactorsInput,
  type ScenarioRunResult,
  type ScenarioListRow,
  type SweepResult,
  type Playbook,
} from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { RadarIcon } from "@/components/nav-icons";

const DEFAULT_FACTORS: ScenarioFactorsInput = {
  temperatureC: 34,
  loadPct: 65,
  humidityPct: 40,
  aqi: 60,
  powerOutageHours: 0,
  suspiciousLoginAttempts: 0,
};

const FIELDS: { key: keyof ScenarioFactorsInput; label: string; min: number; max: number; unit: string }[] = [
  { key: "temperatureC", label: "درجة الحرارة", min: -10, max: 55, unit: "°C" },
  { key: "loadPct", label: "الحمل الكهربائي", min: 0, max: 140, unit: "%" },
  { key: "humidityPct", label: "الرطوبة", min: 0, max: 100, unit: "%" },
  { key: "aqi", label: "جودة الهواء (AQI)", min: 0, max: 300, unit: "" },
  { key: "powerOutageHours", label: "مدة انقطاع الكهرباء", min: 0, max: 24, unit: "ساعة" },
  { key: "suspiciousLoginAttempts", label: "محاولات دخول مشبوهة", min: 0, max: 100, unit: "" },
];

function impactTone(score: number) {
  if (score >= 80) return { bg: "bg-danger/10", text: "text-danger" };
  if (score >= 50) return { bg: "bg-warning/10", text: "text-warning" };
  return { bg: "bg-success/10", text: "text-success" };
}

export default function FuturePage() {
  const [factors, setFactors] = useState<ScenarioFactorsInput>(DEFAULT_FACTORS);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ScenarioRunResult | null>(null);
  const [freezeNameById, setFreezeNameById] = useState<Record<string, string>>({});
  const [frozenIds, setFrozenIds] = useState<Set<string>>(new Set());

  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<SweepResult | null>(null);

  const [history, setHistory] = useState<ScenarioListRow[] | null>(null);
  const [playbooks, setPlaybooks] = useState<Playbook[] | null>(null);

  function loadHistory() {
    fetchScenarios().then(setHistory);
    fetchPlaybooks().then(setPlaybooks);
  }

  useEffect(loadHistory, []);

  async function handleRun() {
    setRunning(true);
    try {
      const res = await runScenario(factors);
      setResult(res);
      loadHistory();
    } finally {
      setRunning(false);
    }
  }

  async function handleSweep() {
    setSweeping(true);
    try {
      const res = await runNightlySweep();
      setSweepResult(res);
      loadHistory();
    } finally {
      setSweeping(false);
    }
  }

  async function handleFreeze(scenarioId: string) {
    const name = freezeNameById[scenarioId]?.trim();
    if (!name) return;
    await freezePlaybook(scenarioId, name);
    setFrozenIds((prev) => new Set(prev).add(scenarioId));
    fetchPlaybooks().then(setPlaybooks);
  }

  async function handleActivate(playbookId: string) {
    await activatePlaybook(playbookId);
    fetchPlaybooks().then(setPlaybooks);
  }

  return (
    <>
      <Topbar title="مرصاد المستقبل" />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <section className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-raised px-6 py-5 shadow-card">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-brand text-[var(--brand-gold)]">
              <RadarIcon className="h-5 w-5" />
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              محرك محاكاة يُشغّل نفس نموذج التنبؤ الحقيقي (المُدرَّب عبر مرصاد الاتحادي إن
              توفّر) على مدخلات افتراضية، ليكتشف مخاطر مركّبة لم تحدث بعد قبل وقوعها فعليًا.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">وضع المحاكاة التفاعلي (What-If)</h2>
            <div className="flex flex-col gap-5">
              {FIELDS.map((field) => (
                <div key={field.key}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-text-primary">{field.label}</span>
                    <span
                      className="rounded-[3px] bg-brand/10 px-2 py-0.5 font-mono text-xs font-medium text-brand"
                      dir="ltr"
                    >
                      {factors[field.key]} {field.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    value={factors[field.key]}
                    onChange={(e) => setFactors({ ...factors, [field.key]: Number(e.target.value) })}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sunken accent-[var(--brand-gold)]"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleRun}
              disabled={running}
              className="mt-5 rounded-[var(--radius-sm)] bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
            >
              {running ? "جارٍ تشغيل المحاكاة..." : "تشغيل المحاكاة"}
            </button>
          </section>

          {result && (
            <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary">نتيجة المحاكاة</h2>
                <div className="flex items-center gap-2">
                  {result.isNovel && (
                    <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                      تركيبة جديدة لم تُختبَر سابقًا
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${impactTone(result.impactScore).bg} ${impactTone(result.impactScore).text}`}>
                    درجة الخطورة: {result.impactScore}%
                  </span>
                </div>
              </div>

              <p className="mb-4 rounded-[var(--radius-sm)] bg-canvas p-3.5 text-sm leading-relaxed text-text-secondary">
                {result.rootCauseExplanation}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-start text-xs text-text-tertiary">
                      <th className="pb-2 text-start font-medium">الترتيب</th>
                      <th className="pb-2 text-start font-medium">المبنى</th>
                      <th className="pb-2 text-start font-medium">الخدمة المتأثرة</th>
                      <th className="pb-2 text-start font-medium">درجة الخطورة</th>
                      <th className="pb-2 text-start font-medium">تكلفة الإصلاح التقديرية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.impacts.map((impact) => (
                      <tr key={impact.siteId} className="border-b border-border-subtle last:border-0">
                        <td className="py-2 text-text-tertiary" dir="ltr">
                          {impact.cascadeStep ?? "—"}
                        </td>
                        <td className="py-2 text-text-primary">{impact.siteName}</td>
                        <td className="py-2 text-text-secondary">{impact.affectedService}</td>
                        <td className="py-2 text-text-secondary" dir="ltr">
                          {impact.combined}%
                        </td>
                        <td className="py-2 text-text-secondary" dir="ltr">
                          {impact.estimatedCost.toLocaleString("en-US")} ريال
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  placeholder="اسم خطة الطوارئ"
                  value={freezeNameById[result.id] ?? ""}
                  onChange={(e) => setFreezeNameById({ ...freezeNameById, [result.id]: e.target.value })}
                  className="flex-1 rounded-[var(--radius-sm)] border border-border-subtle bg-canvas px-3.5 py-2 text-sm text-text-primary outline-none focus:border-brand"
                />
                <button
                  onClick={() => handleFreeze(result.id)}
                  disabled={frozenIds.has(result.id) || !freezeNameById[result.id]?.trim()}
                  className="rounded-[var(--radius-sm)] border border-border-subtle px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-60"
                >
                  {frozenIds.has(result.id) ? "تم التجميد" : "تجميد كخطة طوارئ"}
                </button>
              </div>
            </section>
          )}

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">المشغّل التلقائي (المسح الليلي)</h2>
              <button
                onClick={handleSweep}
                disabled={sweeping}
                className="rounded-[var(--radius-sm)] bg-brand px-3.5 py-2 text-xs font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
              >
                {sweeping ? "جارٍ المسح..." : "تشغيل المسح الآن"}
              </button>
            </div>
            <p className="mb-3 text-xs text-text-tertiary">
              يولّد تركيبات عشوائية من عوامل الخطر ويشغّلها عبر نموذج التنبؤ، ويرفع أي تركيبة
              جديدة تنتج أثرًا حرجًا (٩٠%+) كمخاطر مكتشَفة للمراجعة البشرية.
            </p>
            {sweepResult && (
              <p className="mb-3 text-xs text-text-secondary">
                فُحصت {sweepResult.scanned} تركيبة، اكتُشفت {sweepResult.discovered.length} تركيبة حرجة جديدة.
              </p>
            )}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">كل السيناريوهات المُشغَّلة</h2>
            {history && history.length === 0 && <p className="text-sm text-text-tertiary">لم تُشغَّل أي محاكاة بعد.</p>}
            <ul className="flex flex-col gap-3">
              {history?.map((run) => (
                <li key={run.id} className="rounded-[var(--radius-md)] border border-border-subtle bg-canvas p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">
                      {run.triggeredBy === "MANUAL" ? "محاكاة يدوية" : "المسح الليلي التلقائي"}
                      {run.isNovel && " · جديدة"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${impactTone(run.impactScore ?? 0).bg} ${impactTone(run.impactScore ?? 0).text}`}>
                      {run.impactScore}%
                    </span>
                  </div>
                  {run.rootCauseExplanation && (
                    <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{run.rootCauseExplanation}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">خطط الطوارئ المجمَّدة</h2>
            {playbooks && playbooks.length === 0 && <p className="text-sm text-text-tertiary">لا توجد خطط مجمَّدة بعد.</p>}
            <ul className="flex flex-col gap-3">
              {playbooks?.map((pb) => (
                <li key={pb.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-canvas p-3.5">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{pb.name}</p>
                    <p className="mt-0.5 text-xs text-text-tertiary">
                      خطورة السيناريو: {pb.scenarioRun.impactScore}%
                      {pb.activatedAt && " · مُفعَّلة"}
                    </p>
                  </div>
                  {!pb.activatedAt && (
                    <button
                      onClick={() => handleActivate(pb.id)}
                      className="shrink-0 rounded-[var(--radius-sm)] border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                    >
                      تفعيل الآن
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
