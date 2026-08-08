"use client";

import { useEffect, useState } from "react";
import { AUDIT_ACTION_LABELS_AR } from "@marsad/shared";
import { fetchAuditLogs, type AuditLogRow } from "@/lib/api";
import { Topbar } from "@/components/topbar";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatMetadata(metadata: Record<string, unknown>): string {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return "—";
  return entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(" · ");
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogRow[] | null>(null);

  useEffect(() => {
    fetchAuditLogs().then(setLogs);
  }, []);

  return (
    <>
      <Topbar title="سجل التدقيق" />
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <p className="text-sm leading-relaxed text-text-secondary">
              سجل حقيقي لآخر 100 إجراء حسّاس ضمن جهتكم — تسجيل دخول، إنشاء تنبيهات، إرسال
              إشعارات، تجميد/تفعيل خطط طوارئ، تنفيذ إجراءات استمرارية، وتشغيل جولات مرصاد
              الاتحادي — يُكتب مباشرة عند وقوع كل إجراء عبر <code dir="ltr">AuditLogService</code>،
              متاح فقط لمدير الجهة ومدير النظام.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            {logs && logs.length === 0 && (
              <p className="text-sm text-text-tertiary">لا توجد إجراءات مسجَّلة بعد.</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-start text-xs text-text-tertiary">
                    <th className="pb-2 text-start font-medium">الإجراء</th>
                    <th className="pb-2 text-start font-medium">الكيان</th>
                    <th className="pb-2 text-start font-medium">المستخدم</th>
                    <th className="pb-2 text-start font-medium">التفاصيل</th>
                    <th className="pb-2 text-start font-medium">الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.map((log) => (
                    <tr key={log.id} className="border-b border-border-subtle last:border-0">
                      <td className="py-2.5 text-text-primary">
                        {AUDIT_ACTION_LABELS_AR[log.action] ?? log.action}
                      </td>
                      <td className="py-2.5 text-text-secondary" dir="ltr">
                        {log.entityType}
                      </td>
                      <td className="py-2.5 text-text-secondary">
                        {log.actor?.fullName ?? "نظام"}
                      </td>
                      <td className="py-2.5 text-text-tertiary" dir="ltr">
                        {formatMetadata(log.metadata)}
                      </td>
                      <td className="py-2.5 text-text-tertiary" dir="ltr">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
