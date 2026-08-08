"use client";

import { useEffect, useState } from "react";
import {
  fetchSupportTeam,
  fetchEscalationRules,
  createSupportAlert,
  fetchNotificationPreview,
  sendNotifications,
  type SupportTeamMember,
  type EscalationRule,
  type CreateAlertResponse,
  type NotificationPreview,
  type NotificationLogRow,
} from "@/lib/api";
import { Topbar } from "@/components/topbar";
import {
  ROLE_LABELS_AR,
  ALERT_CATEGORY_LABELS_AR,
  NOTIFICATION_CHANNEL_LABELS_AR,
  type RoleKey,
} from "@marsad/shared";

const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: "متوفر",
  BUSY: "مشغول",
  UNAVAILABLE: "غير متوفر",
};

const AVAILABILITY_TONE: Record<string, string> = {
  AVAILABLE: "bg-success/10 text-success",
  BUSY: "bg-warning/10 text-warning",
  UNAVAILABLE: "bg-sunken text-text-tertiary",
};

const SEVERITY_OPTIONS: { value: "CRITICAL" | "WARNING" | "INFO"; label: string }[] = [
  { value: "CRITICAL", label: "سريع" },
  { value: "WARNING", label: "تحذير" },
  { value: "INFO", label: "إرشادي" },
];

export default function SupportPage() {
  const [team, setTeam] = useState<SupportTeamMember[] | null>(null);
  const [rules, setRules] = useState<EscalationRule[] | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"CRITICAL" | "WARNING" | "INFO">("WARNING");
  const [category, setCategory] = useState(Object.keys(ALERT_CATEGORY_LABELS_AR)[0]);
  const [submitting, setSubmitting] = useState(false);

  const [created, setCreated] = useState<CreateAlertResponse | null>(null);
  const [previews, setPreviews] = useState<NotificationPreview[] | null>(null);
  const [sending, setSending] = useState(false);
  const [sentLogs, setSentLogs] = useState<NotificationLogRow[] | null>(null);

  useEffect(() => {
    fetchSupportTeam().then(setTeam);
    fetchEscalationRules().then(setRules);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSentLogs(null);
    try {
      const result = await createSupportAlert({ title, description, severity, category });
      setCreated(result);
      const preview = await fetchNotificationPreview(result.alert.id);
      setPreviews(preview);
      setTitle("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSend() {
    if (!created) return;
    setSending(true);
    try {
      const logs = await sendNotifications(created.alert.id);
      setSentLogs(logs);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Topbar title="الدعم الفني" />
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">إرسال تنبيه جديد</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">العنوان</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-[var(--radius-sm)] border border-border-subtle bg-canvas px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">الوصف</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-[var(--radius-sm)] border border-border-subtle bg-canvas px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">النوع</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as typeof severity)}
                    className="rounded-[var(--radius-sm)] border border-border-subtle bg-canvas px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-brand"
                  >
                    {SEVERITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">الفئة</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded-[var(--radius-sm)] border border-border-subtle bg-canvas px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-brand"
                  >
                    {Object.entries(ALERT_CATEGORY_LABELS_AR).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="self-start rounded-[var(--radius-sm)] bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
              >
                {submitting ? "جارٍ الإرسال..." : "إرسال التنبيه"}
              </button>
            </form>

            {created && (
              <div className="mt-4 rounded-[var(--radius-sm)] bg-success/10 px-3.5 py-2.5 text-sm text-success">
                تم إنشاء التنبيه وتوجيهه تلقائيًا إلى{" "}
                {created.assignedUser ? `${created.assignedUser.fullName} (${created.assignedUser.roleName})` : "لا يوجد عضو متاح حاليًا"}
                .
              </div>
            )}
          </section>

          {previews && (
            <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary">معاينة القنوات قبل الإرسال</h2>
                <button
                  onClick={handleSend}
                  disabled={sending || sentLogs !== null}
                  className="rounded-[var(--radius-sm)] bg-brand px-3.5 py-2 text-xs font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
                >
                  {sentLogs ? "تم الإرسال" : sending ? "جارٍ الإرسال..." : "إرسال الآن على كل القنوات"}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {previews.map((p) => {
                  const log = sentLogs?.find((l) => l.channel === p.channel);
                  return (
                    <div key={p.channel} className="rounded-[var(--radius-md)] border border-border-subtle bg-canvas p-3.5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-primary">
                          {NOTIFICATION_CHANNEL_LABELS_AR[p.channel] ?? p.channel}
                        </span>
                        {log && (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                            أُرسلت
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-line text-xs leading-relaxed text-text-secondary">
                        {p.renderedContent}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">مصفوفة التصعيد الزمنية</h2>
            <ul className="flex flex-col gap-3">
              {rules?.map((rule) => (
                <li key={rule.id} className="flex items-center gap-4 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                    {rule.level}
                  </span>
                  <span className="w-24 shrink-0 text-text-tertiary">
                    {rule.delayMinutes === 0 ? "فوري" : `بعد ${rule.delayMinutes} دقيقة`}
                  </span>
                  <span className="text-text-primary">
                    {rule.notifyRoles.map((r) => ROLE_LABELS_AR[r as RoleKey] ?? r).join("، ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">دليل فرق الدعم الفني</h2>
            <ul className="flex flex-col gap-3">
              {team?.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="text-text-primary">{member.fullName}</p>
                    <p className="text-xs text-text-tertiary">{member.role.name}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${AVAILABILITY_TONE[member.availabilityStatus]}`}>
                    {AVAILABILITY_LABEL[member.availabilityStatus]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
