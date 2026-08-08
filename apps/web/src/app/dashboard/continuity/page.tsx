"use client";

import { useEffect, useState } from "react";
import {
  SCHEDULED_SERVICE_TYPE_LABELS_AR,
  CONTINUITY_ACTION_LABELS_AR,
} from "@marsad/shared";
import {
  fetchPredictions,
  fetchPlaybooks,
  fetchScheduledServices,
  evaluateContinuity,
  applyContinuityAction,
  fetchContinuityActions,
  type Prediction,
  type Playbook,
  type ScheduledServiceRow,
  type ContinuityProposal,
  type ContinuityActionRow,
  type ContinuitySourceType,
} from "@/lib/api";
import { Topbar } from "@/components/topbar";

function severityTone(score: number) {
  if (score >= 90) return { bg: "bg-danger/10", text: "text-danger" };
  if (score >= 70) return { bg: "bg-warning/10", text: "text-warning" };
  return { bg: "bg-success/10", text: "text-success" };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export default function ContinuityPage() {

  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [playbooks, setPlaybooks] = useState<Playbook[] | null>(null);
  const [scheduledServices, setScheduledServices] = useState<ScheduledServiceRow[] | null>(null);
  const [actions, setActions] = useState<ContinuityActionRow[] | null>(null);

  const [sourceKey, setSourceKey] = useState<string>("");
  const [proposals, setProposals] = useState<ContinuityProposal[] | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  function loadAll() {
    fetchPredictions().then(setPredictions);
    fetchPlaybooks().then((pbs) => setPlaybooks(pbs.filter((p) => p.activatedAt)));
    fetchScheduledServices().then(setScheduledServices);
    fetchContinuityActions().then(setActions);
  }

  useEffect(loadAll, []);

  async function handleEvaluate() {
    if (!sourceKey) return;
    const [sourceType, sourceId] = sourceKey.split(":") as [ContinuitySourceType, string];
    setEvaluating(true);
    setProposals(null);
    try {
      const res = await evaluateContinuity(sourceType, sourceId);
      setProposals(res);
      setAppliedIds(new Set(res.filter((p) => p.alreadyApplied).map((p) => p.scheduledServiceId)));
    } finally {
      setEvaluating(false);
    }
  }

  async function handleApply(proposal: ContinuityProposal) {
    const [sourceType, sourceId] = sourceKey.split(":") as [ContinuitySourceType, string];
    setApplyingId(proposal.scheduledServiceId);
    try {
      await applyContinuityAction({
        scheduledServiceId: proposal.scheduledServiceId,
        sourceType,
        sourceId,
        actionTaken: proposal.recommendedAction,
      });
      setAppliedIds((prev) => new Set(prev).add(proposal.scheduledServiceId));
      fetchContinuityActions().then(setActions);
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <>
      <Topbar title="استمرارية الخدمة" />
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <p className="text-sm leading-relaxed text-text-secondary">
              محرك يفحص الخدمات المجدولة (جلسات/مواعيد/معاملات) عند المواقع المتأثرة بتنبؤ ذكي
              نشط أو خطة طوارئ مُفعَّلة، ويقترح إجراء استمرارية فعليًا — تحويل عن بُعد، إعادة
              توجيه لموقع أقل تأثرًا، أو إلغاء وإعادة جدولة — بناءً على نوع الخدمة ودرجة الخطورة
              الفعلية ووجود موقع بديل ضمن نفس المنطقة.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">تقييم الأثر على الخدمات المجدولة</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={sourceKey}
                onChange={(e) => {
                  setSourceKey(e.target.value);
                  setProposals(null);
                }}
                className="flex-1 rounded-[var(--radius-sm)] border border-border-subtle bg-canvas px-3.5 py-2 text-sm text-text-primary outline-none focus:border-brand"
              >
                <option value="">اختر تنبؤًا نشطًا أو خطة طوارئ مُفعَّلة...</option>
                {predictions && predictions.length > 0 && (
                  <optgroup label="تنبؤات نشطة">
                    {predictions.map((p) => (
                      <option key={p.id} value={`PREDICTION:${p.id}`}>
                        {p.title} ({p.confidencePct}%)
                      </option>
                    ))}
                  </optgroup>
                )}
                {playbooks && playbooks.length > 0 && (
                  <optgroup label="خطط طوارئ مُفعَّلة">
                    {playbooks.map((pb) => (
                      <option key={pb.id} value={`SCENARIO:${pb.id}`}>
                        {pb.name} ({pb.scenarioRun.impactScore}%)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button
                onClick={handleEvaluate}
                disabled={!sourceKey || evaluating}
                className="shrink-0 rounded-[var(--radius-sm)] bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
              >
                {evaluating ? "جارٍ التقييم..." : "تقييم الأثر"}
              </button>
            </div>
          </section>

          {proposals && (
            <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-text-primary">
                الإجراءات المقترحة {proposals.length > 0 && `(${proposals.length})`}
              </h2>
              {proposals.length === 0 && (
                <p className="text-sm text-text-tertiary">
                  لا توجد خدمات مجدولة متأثرة تستدعي إجراء استمرارية ضمن نافذة هذا المصدر.
                </p>
              )}
              <ul className="flex flex-col gap-3">
                {proposals.map((p) => {
                  const applied = appliedIds.has(p.scheduledServiceId);
                  const tone = severityTone(p.severity);
                  return (
                    <li
                      key={p.scheduledServiceId}
                      className="rounded-[var(--radius-md)] border border-border-subtle bg-canvas p-3.5"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {SCHEDULED_SERVICE_TYPE_LABELS_AR[p.type]} — {p.siteName}
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${tone.bg} ${tone.text}`}>
                          {p.severity}%
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary" dir="ltr">
                        {formatDate(p.scheduledAt)}
                      </p>
                      <p className="mt-1 text-xs text-text-tertiary">{p.beneficiaryContact}</p>
                      <p className="mt-2 text-xs leading-relaxed text-text-secondary">{p.reason}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                          {CONTINUITY_ACTION_LABELS_AR[p.recommendedAction]}
                        </span>
                        <button
                          onClick={() => handleApply(p)}
                          disabled={applied || applyingId === p.scheduledServiceId}
                          className="rounded-[var(--radius-sm)] border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-60"
                        >
                          {applied
                            ? "تم التنفيذ"
                            : applyingId === p.scheduledServiceId
                              ? "جارٍ التنفيذ..."
                              : "تنفيذ الإجراء وإشعار المستفيد"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">الخدمات المجدولة القادمة</h2>
            {scheduledServices && scheduledServices.length === 0 && (
              <p className="text-sm text-text-tertiary">لا توجد خدمات مجدولة قادمة.</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-start text-xs text-text-tertiary">
                    <th className="pb-2 text-start font-medium">النوع</th>
                    <th className="pb-2 text-start font-medium">الموقع</th>
                    <th className="pb-2 text-start font-medium">الموعد</th>
                    <th className="pb-2 text-start font-medium">المستفيد</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledServices?.map((s) => (
                    <tr key={s.id} className="border-b border-border-subtle last:border-0">
                      <td className="py-2 text-text-primary">{SCHEDULED_SERVICE_TYPE_LABELS_AR[s.type]}</td>
                      <td className="py-2 text-text-secondary">{s.siteName}</td>
                      <td className="py-2 text-text-secondary" dir="ltr">{formatDate(s.scheduledAt)}</td>
                      <td className="py-2 text-text-tertiary">{s.beneficiaryContact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">سجل إجراءات الاستمرارية</h2>
            {actions && actions.length === 0 && (
              <p className="text-sm text-text-tertiary">لم يُنفَّذ أي إجراء استمرارية بعد.</p>
            )}
            <ul className="flex flex-col gap-3">
              {actions?.map((a) => (
                <li key={a.id} className="rounded-[var(--radius-md)] border border-border-subtle bg-canvas p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {SCHEDULED_SERVICE_TYPE_LABELS_AR[a.serviceType]} — {a.siteName}
                    </span>
                    <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                      {CONTINUITY_ACTION_LABELS_AR[a.actionTaken]}
                    </span>
                  </div>
                  {a.sourceLabel && (
                    <p className="mt-1 text-xs text-text-tertiary">المصدر: {a.sourceLabel}</p>
                  )}
                  <p className="mt-1 text-xs text-text-tertiary" dir="ltr">
                    الموعد الأصلي: {formatDate(a.scheduledAt)}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">{a.beneficiaryContact}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
