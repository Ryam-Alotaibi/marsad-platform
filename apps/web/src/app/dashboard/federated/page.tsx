"use client";

import { useEffect, useState } from "react";
import {
  fetchFederatedStatus,
  joinFederatedNetwork,
  leaveFederatedNetwork,
  runFederatedRound,
  type FederatedStatus,
  type FederatedRoundResult,
} from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { NetworkIcon } from "@/components/nav-icons";
import { TENANT_TYPE_LABELS_AR, type TenantType } from "@marsad/shared";

function truncateHash(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function FederatedPage() {
  const [status, setStatus] = useState<FederatedStatus | null>(null);
  const [toggling, setToggling] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState<FederatedRoundResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadStatus() {
    fetchFederatedStatus().then(setStatus);
  }

  useEffect(loadStatus, []);

  async function handleToggleParticipation() {
    if (!status) return;
    setToggling(true);
    setError(null);
    try {
      if (status.isParticipating) {
        await leaveFederatedNetwork();
      } else {
        await joinFederatedNetwork();
      }
      loadStatus();
    } finally {
      setToggling(false);
    }
  }

  async function handleRunRound() {
    setRunning(true);
    setError(null);
    try {
      const result = await runFederatedRound();
      setLastRoundResult(result);
      loadStatus();
    } catch {
      setError("تعذّر تشغيل الجولة — تأكدي من وجود جهات مشاركة كافية.");
    } finally {
      setRunning(false);
    }
  }

  const maxRoundAccuracy = status?.rounds.length
    ? Math.max(...status.rounds.map((r) => r.aggregateAccuracy ?? 0))
    : 100;

  return (
    <>
      <Topbar title="شبكة مرصاد الاتحادي" />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {status && (
            <>
              <section
                className="flex items-center gap-4 rounded-[var(--radius-lg)] px-6 py-5 text-white shadow-card"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand-secondary, var(--accent-700)) 0%, var(--brand-primary, var(--accent-600)) 100%)",
                }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/10 text-[var(--brand-gold)]">
                  <NetworkIcon className="h-5 w-5" />
                </div>
                <p className="text-sm leading-relaxed text-white/85">
                  كل جهة تدرّب نموذجها المحلي على بياناتها فقط، ولا تُرسَل أي بيانات خام بين
                  الجهات — فقط أوزان النموذج تُجمَّع عبر خوارزمية Federated Averaging لإنتاج
                  نموذج عام أدق، يُوزَّع رجوعًا لكل الجهات المشاركة.
                </p>
              </section>

              <section className="grid grid-cols-2 gap-4">
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                  <p className="text-xs text-text-tertiary">حالة المشاركة</p>
                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-1 text-xs font-medium ${
                      status.isParticipating
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10 text-[var(--gold-600)]"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.isParticipating ? "bg-success" : "bg-[var(--brand-gold)]"}`} />
                    {status.isParticipating ? "مشارِكة بالشبكة" : "غير مشارِكة"}
                  </span>
                  <div>
                    <button
                      onClick={handleToggleParticipation}
                      disabled={toggling}
                      className={`mt-3 rounded-[var(--radius-sm)] px-3.5 py-2 text-xs font-medium transition-all disabled:opacity-60 ${
                        status.isParticipating
                          ? "border border-border-subtle text-text-secondary hover:border-danger/40 hover:text-danger"
                          : "bg-brand text-white hover:brightness-110"
                      }`}
                    >
                      {toggling ? "جارٍ التنفيذ..." : status.isParticipating ? "الانسحاب من الشبكة" : "الانضمام للشبكة"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-tertiary">الجهات المشاركة بالشبكة</p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-brand/10 text-brand">
                      <NetworkIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-1 text-3xl font-semibold text-text-primary" dir="ltr">
                    {status.participatingTenantsCount}
                  </p>
                </div>
              </section>

              {status.myLatestUpdate && (
                <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                  <h2 className="mb-4 text-sm font-semibold text-text-primary">
                    دقة نموذج جهتك — قبل الاستفادة من الشبكة وبعدها
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-tertiary">قبل التجميع (نموذج محلي فقط)</p>
                      <p className="mt-1 text-2xl font-semibold text-text-secondary" dir="ltr">
                        {status.myLatestUpdate.accuracyBefore}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">بعد التجميع (نموذج الشبكة العام)</p>
                      <p className="mt-1 text-2xl font-semibold text-success" dir="ltr">
                        {status.myLatestUpdate.accuracyAfter}%
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-primary">دقة النموذج عبر الجولات</h2>
                  <button
                    onClick={handleRunRound}
                    disabled={running}
                    className="rounded-[var(--radius-sm)] bg-brand px-3.5 py-2 text-xs font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
                  >
                    {running ? "جارٍ التدريب..." : "تشغيل جولة تدريب جديدة"}
                  </button>
                </div>

                {error && <p className="mb-3 text-xs text-danger">{error}</p>}

                {status.rounds.length === 0 ? (
                  <p className="text-sm text-text-tertiary">لم تُشغَّل أي جولة تدريب بعد.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {status.rounds.map((round) => (
                      <li key={round.roundNumber}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-text-secondary">الجولة {round.roundNumber}</span>
                          <span className="font-medium text-text-primary" dir="ltr">
                            {round.aggregateAccuracy}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${((round.aggregateAccuracy ?? 0) / maxRoundAccuracy) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {lastRoundResult && (
                  <div className="mt-5 border-t border-border-subtle pt-4">
                    <p className="mb-2 text-xs font-medium text-text-secondary">
                      نتيجة آخر جولة — {lastRoundResult.participatingTenants.length} جهة شاركت
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border-subtle text-start text-xs text-text-tertiary">
                            <th className="pb-2 text-start font-medium">الجهة</th>
                            <th className="pb-2 text-start font-medium">العينات</th>
                            <th className="pb-2 text-start font-medium">قبل</th>
                            <th className="pb-2 text-start font-medium">بعد</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lastRoundResult.participatingTenants.map((t) => (
                            <tr key={t.tenantId} className="border-b border-border-subtle last:border-0">
                              <td className="py-2 text-text-primary">{t.tenantName}</td>
                              <td className="py-2 text-text-secondary" dir="ltr">
                                {t.sampleCount}
                              </td>
                              <td className="py-2 text-text-secondary" dir="ltr">
                                {t.accuracyBefore}%
                              </td>
                              <td className="py-2 text-success" dir="ltr">
                                {t.accuracyAfter}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">سجل التدقيق المشفّر</h2>
                {status.auditChain.length === 0 ? (
                  <p className="text-sm text-text-tertiary">لا توجد تحديثات مسجّلة بعد.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle text-start text-xs text-text-tertiary">
                          <th className="pb-2 text-start font-medium">الجهة</th>
                          <th className="pb-2 text-start font-medium">بصمة التحديث (Hash)</th>
                          <th className="pb-2 text-start font-medium">الوقت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {status.auditChain.map((entry) => (
                          <tr key={entry.id} className="border-b border-border-subtle last:border-0">
                            <td className="py-2 text-text-primary">
                              {entry.tenantName}
                              <span className="ms-1.5 text-xs text-text-tertiary">
                                ({TENANT_TYPE_LABELS_AR[entry.tenantType as TenantType]})
                              </span>
                            </td>
                            <td className="py-2 font-mono text-xs text-text-secondary" dir="ltr">
                              {truncateHash(entry.auditHashSelf)}
                            </td>
                            <td className="py-2 text-text-tertiary" dir="ltr">
                              {formatDateTime(entry.submittedAt)}
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
