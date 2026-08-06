"use client";

import { Topbar } from "@/components/topbar";
import { BrandMark } from "@/components/brand-mark";
import { t } from "@/i18n/t";

const HIGHLIGHTS = [
  {
    title: "منصة عامة متعددة الجهات",
    description:
      "قابلة للإعداد لأي جهة — حكومية، صحية، أو خاصة — كل جهة بمعزل كامل عن غيرها على مستوى قاعدة البيانات (Row-Level Security)، بألوانها وأدوارها الخاصة.",
  },
  {
    title: "تنبؤ ذكي بالأعطال",
    description:
      "يجمع قراءات الكهرباء والاتصالات والطقس وأجهزة الاستشعار في مكان واحد، ليكتشف الأنماط المركّبة التي تسبق الأعطال قبل وقوعها فعليًا.",
  },
  {
    title: "شبكة مرصاد الاتحادي",
    description:
      "تعلّم اتحادي حقيقي (Federated Learning) — كل جهة تدرّب نموذجها محليًا على بياناتها الخاصة، ولا تُرسَل أي بيانات خام بين الجهات، فقط أوزان النموذج تُجمَّع لإنتاج نموذج عام أدق.",
  },
  {
    title: "مرصاد المستقبل",
    description:
      "محرك محاكاة (توأم رقمي) يُشغّل نموذج التنبؤ نفسه على سيناريوهات افتراضية لاكتشاف مخاطر مركّبة لم تحدث بعد، مع خطط طوارئ قابلة للتجميد والتفعيل الفوري.",
  },
  {
    title: "استمرارية الخدمة",
    description:
      "يربط التنبؤات والمخاطر مباشرة بالخدمات المجدولة للمستفيدين (مواعيد، جلسات، معاملات) ويقترح إجراءات استباقية قبل أن يتأثر أي مستفيد.",
  },
  {
    title: "مستشار ذكي مبني على بيانات حقيقية",
    description:
      "يستعلم فعليًا عن حالة الأنظمة من قاعدة البيانات قبل الإجابة، مع طبقة توليد لغوي اختيارية (OpenAI أو Anthropic) فوق الحقائق المسترجعة — لا يخترع أي رقم.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Topbar title="عن النظام" />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <section
            className="flex items-center gap-4 rounded-[var(--radius-lg)] px-6 py-6 text-white shadow-card"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-secondary, var(--accent-700)) 0%, var(--brand-primary, var(--accent-600)) 100%)",
            }}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/10 text-[var(--brand-gold)]">
              <BrandMark className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{t("app.name")}</h1>
              <p className="mt-1 text-sm text-white/85">{t("app.tagline")}</p>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">الفكرة</h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              مرصاد منصة وطنية للتنبؤ الذكي بالأعطال التقنية للبنية التحتية — تُبنى على فرضية أن
              معظم الأعطال الكبرى لا تحدث فجأة، بل تسبقها إشارات مبكرة متفرقة (حمل كهربائي مرتفع،
              حرارة غير معتادة، بطء شبكة، سلوك غير طبيعي بمستشعر) لا يلاحظها أحد لأنها موزّعة على
              أنظمة منفصلة. تجمع مرصاد كل هذه الإشارات في مكان واحد وتربطها ببعضها لتنبّه الجهة
              المعنية قبل وقوع العطل الفعلي، لا بعده.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-text-primary">أبرز ما يميّز النظام</h2>
            <div className="flex flex-col gap-3">
              {HIGHLIGHTS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 shadow-card"
                >
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">الفريق</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-text-tertiary">تنفيذ</dt>
                <dd className="font-medium text-text-primary">ريام منصور العتيبي</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                <dt className="text-text-tertiary">إشراف</dt>
                <dd className="font-medium text-text-primary">
                  م. عبدالرحمن المعارك — مدير إقليمي، وزارة العدل
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </main>
    </>
  );
}
