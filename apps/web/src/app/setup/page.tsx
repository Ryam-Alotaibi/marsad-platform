"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TENANT_TYPE_LABELS_AR, TENANT_TYPES, type TenantType } from "@marsad/shared";
import { setupTenant, type SetupTenantPayload } from "@/lib/api";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/i18n/t";

type FormState = SetupTenantPayload;

const DEFAULT_STATE: FormState = {
  nameAr: "",
  name: "",
  type: "GOVERNMENT",
  primaryColor: "#1E4A36",
  secondaryColor: "#0F2E20",
  regionName: "",
  siteName: "",
  adminFullName: "",
  adminEmail: "",
  adminPassword: "",
};

const STEPS = ["بيانات الجهة", "الموقع الأول", "حساب المدير", "مراجعة وإنشاء"];

function inputClass() {
  return "rounded-[var(--radius-sm)] border border-border-subtle bg-raised px-3.5 py-2.5 text-sm text-text-primary shadow-card outline-none transition-colors placeholder:text-text-tertiary focus:border-brand focus:ring-2 focus:ring-brand/20";
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    if (step === 0) return form.nameAr.trim().length >= 2 && form.name.trim().length >= 2;
    if (step === 1) return form.regionName.trim().length >= 2 && form.siteName.trim().length >= 2;
    if (step === 2) {
      return (
        form.adminFullName.trim().length >= 2 &&
        /\S+@\S+\.\S+/.test(form.adminEmail) &&
        form.adminPassword.length >= 8
      );
    }
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await setupTenant(form);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "GENERIC_ERROR");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-1 items-center justify-center bg-canvas px-6">
        <div className="w-full max-w-sm text-center">
          <BrandMark className="mx-auto h-10 w-10 text-brand" />
          <h1 className="mt-4 text-xl font-semibold text-text-primary">تم إنشاء الجهة بنجاح</h1>
          <p className="mt-2 text-sm text-text-secondary">
            يمكنك الآن تسجيل الدخول بحساب مدير الجهة الذي أنشأتِه: {form.adminEmail}
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 w-full rounded-[var(--radius-sm)] bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:brightness-110"
          >
            الذهاب لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7 text-brand" />
          <span className="text-base font-semibold text-text-primary">{t("app.name")}</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-start justify-center px-6 pb-16">
        <div className="w-full max-w-lg">
          <h1 className="text-xl font-semibold text-text-primary">إعداد جهة جديدة</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            معالج إعداد حقيقي — ينشئ سجل الجهة، أدوارها السبعة الافتراضية، أول موقع، وحساب مدير
            الجهة فعليًا بقاعدة البيانات.
          </p>

          <div className="mt-6 flex items-center gap-1.5">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 flex-col gap-1.5">
                <div
                  className={`h-1 rounded-full ${i <= step ? "bg-brand" : "bg-sunken"}`}
                />
                <span className={`text-[11px] ${i === step ? "text-brand" : "text-text-tertiary"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {step === 0 && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">اسم الجهة (بالعربي)</label>
                  <input
                    value={form.nameAr}
                    onChange={(e) => update("nameAr", e.target.value)}
                    className={inputClass()}
                    placeholder="الهيئة العامة للخدمات الرقمية"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">اسم الجهة (بالإنجليزي)</label>
                  <input
                    dir="ltr"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={inputClass()}
                    placeholder="Digital Services Authority"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">نوع الجهة</label>
                  <select
                    value={form.type}
                    onChange={(e) => update("type", e.target.value as TenantType)}
                    className={inputClass()}
                  >
                    {TENANT_TYPES.map((tp) => (
                      <option key={tp} value={tp}>
                        {TENANT_TYPE_LABELS_AR[tp]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">اللون الأساسي</label>
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      className="h-10 w-full cursor-pointer rounded-[var(--radius-sm)] border border-border-subtle bg-raised"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">اللون الثانوي</label>
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) => update("secondaryColor", e.target.value)}
                      className="h-10 w-full cursor-pointer rounded-[var(--radius-sm)] border border-border-subtle bg-raised"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">اسم المنطقة/الفرع الأول</label>
                  <input
                    value={form.regionName}
                    onChange={(e) => update("regionName", e.target.value)}
                    className={inputClass()}
                    placeholder="المنطقة الرئيسية"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">اسم الموقع/المبنى الأول</label>
                  <input
                    value={form.siteName}
                    onChange={(e) => update("siteName", e.target.value)}
                    className={inputClass()}
                    placeholder="المبنى الرئيسي"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">الاسم الكامل لمدير الجهة</label>
                  <input
                    value={form.adminFullName}
                    onChange={(e) => update("adminFullName", e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">البريد الإلكتروني</label>
                  <input
                    dir="ltr"
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => update("adminEmail", e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">كلمة المرور (8 أحرف على الأقل)</label>
                  <input
                    dir="ltr"
                    type="password"
                    value={form.adminPassword}
                    onChange={(e) => update("adminPassword", e.target.value)}
                    className={inputClass()}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 shadow-card">
                <dl className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-tertiary">الجهة</dt>
                    <dd className="text-text-primary">
                      {form.nameAr} ({TENANT_TYPE_LABELS_AR[form.type]})
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-tertiary">الموقع الأول</dt>
                    <dd className="text-text-primary">
                      {form.regionName} — {form.siteName}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-tertiary">مدير الجهة</dt>
                    <dd className="text-text-primary" dir="ltr">
                      {form.adminEmail}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {error && (
              <p className="rounded-[var(--radius-sm)] bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            )}

            <div className="mt-2 flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-[var(--radius-sm)] border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  السابق
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => canProceed() && setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="flex-1 rounded-[var(--radius-sm)] bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
                >
                  التالي
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-[var(--radius-sm)] bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
                >
                  {submitting ? "جارٍ الإنشاء..." : "إنشاء الجهة"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
