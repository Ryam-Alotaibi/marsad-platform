"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { t } from "@/i18n/t";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

const DEMO_EMAIL = "tenant-admin@gov.marsad.local";
const DEMO_PASSWORD = "Marsad@2026";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "GENERIC_ERROR";
      setError(message === "INVALID_CREDENTIALS" ? t("auth.login.errorInvalid") : t("auth.login.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 bg-canvas">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-[var(--brand-secondary,var(--ink-950))] p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 15%, var(--brand-primary, var(--accent-500)) 0%, transparent 45%), radial-gradient(circle at 85% 75%, var(--accent-400) 0%, transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-3 text-white">
          <BrandMark className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight">{t("app.name")}</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight text-white">{t("app.tagline")}</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            منصة عامة قابلة للإعداد لأي جهة — حكومية، صحية، أو خاصة — تجمع قراءات الكهرباء
            والاتصالات والطقس وأجهزة الاستشعار في مكان واحد للتنبؤ بالأعطال قبل وقوعها.
          </p>
        </div>
        <div className="relative flex flex-col gap-1 text-xs text-white/60">
          <span>إصدار تجريبي — المرحلة الأولى</span>
          <span>الفكرة والتنفيذ: ريام · إشراف: م. عبدالرحمن المعارك</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-end p-6">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-24">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <BrandMark className="h-7 w-7 text-brand" />
              <span className="text-base font-semibold text-text-primary">{t("app.name")}</span>
            </div>

            <h2 className="text-xl font-semibold text-text-primary">{t("auth.login.title")}</h2>
            <p className="mt-1.5 text-sm text-text-secondary">{t("auth.login.subtitle")}</p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-text-secondary">
                  {t("auth.login.emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.login.emailPlaceholder")}
                  className="rounded-[var(--radius-sm)] border border-border-subtle bg-raised px-3.5 py-2.5 text-sm text-text-primary shadow-card outline-none transition-colors placeholder:text-text-tertiary focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-text-secondary">
                  {t("auth.login.passwordLabel")}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.login.passwordPlaceholder")}
                  className="rounded-[var(--radius-sm)] border border-border-subtle bg-raised px-3.5 py-2.5 text-sm text-text-primary shadow-card outline-none transition-colors placeholder:text-text-tertiary focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              {error && (
                <p className="rounded-[var(--radius-sm)] bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-[var(--radius-sm)] bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
              >
                {submitting ? t("auth.login.submitting") : t("auth.login.submit")}
              </button>
            </form>

            <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-border-subtle bg-sunken p-4">
              <p className="text-xs font-medium text-text-secondary">بيانات دخول تجريبية موحَّدة (للعرض على الفريق)</p>
              <div className="mt-2 flex flex-col gap-1 text-xs text-text-tertiary" dir="ltr">
                <span>{DEMO_EMAIL}</span>
                <span>{DEMO_PASSWORD}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_EMAIL);
                  setPassword(DEMO_PASSWORD);
                }}
                className="mt-3 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-raised px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
              >
                تعبئة البيانات تلقائيًا
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-text-tertiary">
              جهة جديدة؟{" "}
              <Link href="/setup" className="font-medium text-brand hover:underline">
                إنشاء جهة جديدة
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
