<div dir="rtl">

# مرصاد — منصة وطنية للتنبؤ الذكي بالأعطال التقنية

منصة متعددة الجهات (Multi-Tenant) قابلة للإعداد لأي جهة — حكومية، صحية، أو خاصة — تجمع
قراءات الكهرباء والاتصالات والطقس وأجهزة الاستشعار (IoT) في مكان واحد للتنبؤ بالأعطال
قبل وقوعها، مع طبقة ابتكار "مرصاد الاتحادي" (تعلّم اتحادي بين الجهات + توأم رقمي توليدي
لمحاكاة السيناريوهات المستقبلية).

> **حالة المشروع:** خطة التنفيذ الأصلية (7 مراحل) مكتملة بالكامل — كل شاشات
> القسم 5 (5.1 حتى 5.13) وطبقات الابتكار الثلاث: **مرصاد الاتحادي** (6.1، Federated
> Averaging حقيقي — `/dashboard/federated`)، **التوأم الرقمي التوليدي** (6.2،
> محاكاة What-If تستهلك نفس النموذج المُدرَّب اتحاديًا — `/dashboard/future`)،
> و**محرك استمرارية الخدمة** (6.3، يربط التنبؤات/السيناريوهات بالخدمات المجدولة
> الفعلية — `/dashboard/continuity`). **المرحلة 8** (الحالية) طبقة تصليب وتشغيل
> حقيقية: عزل جهات فعلي بـPostgreSQL Row-Level Security، مصادقة بكوكيز httpOnly
> (لا مزيد من التوكن بـ localStorage)، تحديد معدل الطلبات، سجل تدقيق حقيقي
> (`/dashboard/audit-log`)، مزوّدات تكامل حقيقية (Twilio/SMTP/Anthropic) تُفعَّل
> تلقائيًا عند توفر بيانات اعتماد حقيقية وإلا تسقط بأمان لسلوكها التجريبي الموثَّق،
> معالج إعداد جهة جديدة ذاتي حقيقي (`/setup`)، وخط CI. راجعي
> [ARCHITECTURE.md](ARCHITECTURE.md) للتفاصيل التقنية الكاملة لكل بند.

## التقنيات المستخدمة

| الطبقة | التقنية |
|---|---|
| الواجهة الأمامية | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 — RTL كامل، i18n بملفات JSON، وضع ليلي/نهاري |
| الخادم الرئيسي | NestJS + TypeScript + Prisma ORM |
| خدمة الذكاء الاصطناعي | FastAPI (Python) + NumPy — تدريب/تجميع مرصاد الاتحادي (Federated Averaging حقيقي)، أوزانه تُستهلَك مباشرة بمحركي التوأم الرقمي التوليدي (6.2) واستمرارية الخدمة (6.3) |
| قاعدة البيانات | PostgreSQL |
| البنية | Monorepo بـ npm workspaces (`apps/web`, `apps/api`, `apps/ml`, `packages/shared`) |
| التشغيل | Docker Compose (postgres + api + web + ml بأمر واحد) |

## هيكل المشروع

```
مرصاد/
  apps/
    web/      # Next.js — الواجهة الأمامية
    api/      # NestJS + Prisma — الـ API الرئيسي
    ml/       # FastAPI — خدمة الذكاء الاصطناعي (تدريب/تجميع Federated Averaging)
  packages/
    shared/   # أنواع TypeScript مشتركة (الأدوار، الجهات، مسميات عربية...)
  infra/
    postgres-init/   # سكربت إنشاء دور التطبيق المحدود بحاوية Postgres (RLS)
  .github/workflows/  # CI — بناء + اختبارات
  docker-compose.yml
  .env.example
  ARCHITECTURE.md
```

## التشغيل محليًا

### الخيار 1 — عبر Docker Compose (موصى به للتشغيل الكامل)

```bash
cp .env.example .env
docker compose up --build
```

- الواجهة: http://localhost:3000
- الـ API: http://localhost:4000
- خدمة الذكاء الاصطناعي: http://localhost:8000/health

عند أول تشغيل، نفّذي الترحيل والبذر داخل حاوية الـ API:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

> **ملاحظة:** حاوية Postgres تُنشئ تلقائيًا دورين منفصلين — `POSTGRES_USER` (Superuser،
> للترحيلات فقط) ودور تطبيق محدود الصلاحية `marsad_app` (عبر
> `infra/postgres-init/01-create-app-role.sql`، يُشترط عدم حذف مجلد بيانات الحاوية
> القديم قبل هذا التغيير حتى يعمل init script). هذا الفصل ضروري لعمل عزل الجهات
> الحقيقي (Row-Level Security) — راجعي ARCHITECTURE.md. **لم نُشغِّل `docker compose
> up` فعليًا بهذه البيئة (لا يوجد Docker مثبَّت محليًا)** — تحقّقنا من صحة الملفات
> نصيًا فقط؛ يُنصَح بتجربته فعليًا أول مرة قبل الاعتماد عليه بالإنتاج.

### الخيار 2 — تشغيل مباشر بدون Docker (يتطلب PostgreSQL محليًا)

يتطلب هذا المسار دورين بقاعدة البيانات: دور تطبيق عادي (تُشغِّله الـ API) ودور مرتفع
الصلاحية منفصل للترحيلات/الزرع فقط (`MIGRATOR_DATABASE_URL`) — ضروري لعمل Row-Level
Security بشكل صحيح، راجعي ARCHITECTURE.md "عزل الجهات على مستوى قاعدة البيانات".

```bash
npm install

# الـ API
cd apps/api
cp .env.example .env   # عدّلي DATABASE_URL و MIGRATOR_DATABASE_URL وفق دوري القاعدة لديك
npx prisma migrate dev
npx prisma db seed
npm run start:dev       # http://localhost:4000

# الواجهة (بنافذة طرفية أخرى)
cd apps/web
npm run dev              # http://localhost:3000
```

## الاختبارات

منطق Federated Averaging (مرصاد الاتحادي) مُختبَر بوحدات اختبار حقيقية:

```bash
cd apps/ml
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m pytest tests/ -v
```

## بيانات الدخول التجريبية

بعد تنفيذ `prisma db seed` تُنشأ 3 جهات توضيحية، لكل منها مستخدم لكل دور من الأدوار
السبعة. كلمة المرور لجميع الحسابات: `Marsad@2026`

| الجهة | نوعها | مثال حساب (مدير الجهة) |
|---|---|---|
| الهيئة العامة للخدمات الرقمية | حكومي | `tenant-admin@gov.marsad.local` |
| مستشفى الأمل التخصصي | صحي | `tenant-admin@health.marsad.local` |
| شركة النسيج التقنية | خاص | `tenant-admin@corp.marsad.local` |

بدلًا من بيانات الزرع، يمكن أيضًا إنشاء جهة جديدة فعليًا عبر معالج الإعداد الذاتي على
`/setup` (بدون الحاجة لتشغيل أي سكربت) — راجعي ARCHITECTURE.md "معالج إعداد جهة جديدة".

## الأدوار السبعة الافتراضية

مدير النظام، مدير الجهة، مدير المنطقة، مهندس الدعم الفني، مركز العمليات، مدير
الفرع/الموقع، مستخدم عادي — معرّفة بـ [packages/shared/src/roles.ts](packages/shared/src/roles.ts)
وتُزرع تلقائيًا لكل جهة جديدة.

## قاعدة البيانات

المخطط الكامل بـ [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) مصمَّم
ليغطي كل وحدات المنصة (تعدد الجهات، أجهزة الاستشعار، التنبؤ والمخاطر، التنبيهات
والتصعيد، ترشيد الطاقة، المستشار الذكي، مرصاد الاتحادي، التوأم الرقمي، استمرارية
الخدمة) — راجعي [ARCHITECTURE.md](ARCHITECTURE.md) لتفاصيل كل مجموعة جداول وربطها
بشاشات المنصة.

## فريق العمل

| الدور | الاسم |
|---|---|
| إشراف | م. عبدالرحمن المعارك |
| الفكرة والتنفيذ | ريام |

</div>
