"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-context";
import { Topbar } from "@/components/topbar";
import { ChevronDownIcon } from "@/components/stat-icons";
import type { TenantType } from "@marsad/shared";

const TENANT_INTRO_AR: Record<TenantType, string> = {
  GOVERNMENT: "بصفتك جهة حكومية، تساعدك مرصاد على ضمان استمرارية الخدمات العامة عبر التنبؤ بالأعطال قبل أن تؤثر على المستفيدين.",
  HEALTHCARE: "بصفتك جهة صحية، تساعدك مرصاد على حماية الأنظمة الحرجة (الطاقة، التبريد، الاتصالات) التي تعتمد عليها سلامة المرضى.",
  PRIVATE: "بصفتك شركة خاصة، تساعدك مرصاد على تقليل زمن التوقف غير المخطط له وخفض تكاليف الطاقة عبر التنبؤ الاستباقي.",
  NONPROFIT: "بصفتك جهة غير ربحية، تساعدك مرصاد على إدارة البنية التحتية المحدودة الموارد بكفاءة أعلى عبر التنبؤ المبكر بالأعطال.",
};

interface GuideSection {
  title: string;
  items: { name: string; description: string }[];
}

const SECTIONS: GuideSection[] = [
  {
    title: "النظرة العامة والتنبؤ",
    items: [
      { name: "الرئيسية", description: "بطاقات حالة حية، العوامل الخارجية المؤثرة، وحالة دوائر الاتصالات." },
      { name: "لوحة التحكم التفصيلية", description: "حالة كل خادم ونظام إدارة وشبكة، بمؤشر أداء وحمولة لكل عنصر." },
      { name: "التنبؤ الذكي العاجل", description: "تنبؤات تحليلية بنسبة ثقة وسبب جذري ونافذة زمنية، مع حلول مُسنَدة لفرق محددة." },
      { name: "التنبيهات والمخاطر", description: "مركز تنبيهات مركزي وتقييم مخاطر متعدد العوامل مرجّح." },
    ],
  },
  {
    title: "الخرائط والبيئة",
    items: [
      { name: "خريطة الكهرباء", description: "حالة الأحمال الكهربائية جغرافيًا، ومنحنى حمل 24 ساعة بخطوط تحذير." },
      { name: "خريطة الاتصالات", description: "مصفوفة NOC بين كل موقع وكل مزود اتصالات." },
      { name: "خريطة المخاطر", description: "خريطة حرارية لدرجة الخطورة الإجمالية، مع عمر البنية التحتية وعدد الأعطال التاريخية." },
      { name: "خريطة الطقس", description: "درجات الحرارة وعتبات التأثير على الإلكترونيات لكل موقع." },
      { name: "المخاطر البيئية", description: "مؤشر مركّب وتوزيع المخاطر حسب العامل (اتصالات، كهرباء، حرارة، رطوبة)." },
    ],
  },
  {
    title: "التشغيل والدعم",
    items: [
      { name: "ترشيد الطاقة", description: "جدولة الإيقاف التلقائي، وأزرار إجراءات سريعة حقيقية لخفض الاستهلاك." },
      { name: "الدعم الفني", description: "إرسال تنبيهات جديدة موجَّهة تلقائيًا لأقرب عضو متاح، ومصفوفة تصعيد زمنية." },
      { name: "مستشعرات IoT", description: "حالة كل مبنى (حرارة، رطوبة، جودة هواء، ثاني أكسيد الكربون، تسرب مياه، إضاءة)." },
      { name: "تنبيهات مخصصة", description: "تخصيص قنوات الإشعار وعتبات التنبيه والمناطق المتابَعة حسب دورك." },
      { name: "المستشار الذكي", description: "محادثة تعتمد على بيانات النظام الحقيقية للإجابة عن أسئلتك، مع تنبيهات مركّبة قابلة للتنفيذ." },
    ],
  },
];

export default function GuidePage() {
  const { tenant } = useSession();
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <>
      <Topbar title="دليل المستخدم" />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <p className="text-sm leading-relaxed text-text-secondary">
              {TENANT_INTRO_AR[tenant.type as TenantType]}
            </p>
          </section>

          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">{section.title}</h2>
              <div className="flex flex-col gap-2">
                {section.items.map((item) => {
                  const key = `${section.title}-${item.name}`;
                  const isOpen = openIndex === key;
                  return (
                    <div key={key} className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised shadow-card">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : key)}
                        className="flex w-full items-center justify-between px-4 py-3 text-start"
                      >
                        <span className="text-sm font-medium text-text-primary">{item.name}</span>
                        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-text-tertiary transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <p className="border-t border-border-subtle px-4 py-3 text-sm leading-relaxed text-text-secondary">
                          {item.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
