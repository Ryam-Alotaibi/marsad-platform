"use client";

import { useEffect, useState } from "react";
import { fetchPredictions, fetchOverview, type Prediction } from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { PredictionCard } from "@/components/prediction-card";
import { t } from "@/i18n/t";

const WEATHER_KEYWORDS = ["حرارة", "طقس", "رطوبة", "تبريد", "تكييف"];
const TELECOM_KEYWORDS = ["اتصال", "دائرة", "شبكة", "ألياف", "MPLS", "رابط"];

function categoryOf(prediction: Prediction): "WEATHER" | "TELECOM" | "OTHER" {
  const text = `${prediction.title} ${prediction.rootCause}`;
  if (WEATHER_KEYWORDS.some((k) => text.includes(k))) return "WEATHER";
  if (TELECOM_KEYWORDS.some((k) => text.includes(k))) return "TELECOM";
  return "OTHER";
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [currentTempC, setCurrentTempC] = useState<number | null>(null);

  useEffect(() => {
    fetchPredictions().then(setPredictions);
    fetchOverview().then((o) => setCurrentTempC(o.currentTempC));
  }, []);

  const active = predictions ?? [];
  const urgent = active.filter((p) => p.confidencePct >= 60);
  const weatherCount = active.filter((p) => categoryOf(p) === "WEATHER").length;
  const telecomCount = active.filter((p) => categoryOf(p) === "TELECOM").length;

  return (
    <>
      <Topbar title={t("predictions.title")} />
      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {predictions && predictions.length > 0 && (
            <>
              <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 text-center shadow-card">
                  <p className="text-2xl font-semibold text-danger">{urgent.length}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">قرارات عاجلة مطلوبة</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 text-center shadow-card">
                  <p className="text-2xl font-semibold text-text-primary">{weatherCount}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">مخاطر الطقس</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 text-center shadow-card">
                  <p className="text-2xl font-semibold text-text-primary">{telecomCount}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">مخاطر الاتصالات</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 text-center shadow-card">
                  <p className="text-2xl font-semibold text-text-primary" dir="ltr">
                    {currentTempC !== null ? `${currentTempC.toFixed(1)}°` : "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-text-tertiary">درجة الحرارة</p>
                </div>
              </section>

              {urgent.length > 0 && (
                <section className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-5 shadow-card">
                  <h2 className="mb-3 text-sm font-semibold text-text-primary">القرارات العاجلة المطلوبة</h2>
                  <ul className="flex flex-col gap-3">
                    {urgent.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-sunken px-3.5 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{p.title}</p>
                          <p className="mt-0.5 text-xs text-text-tertiary">{p.rootCause}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">
                          {p.confidencePct}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {predictions && predictions.length === 0 && (
            <p className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-6 text-center text-sm text-text-tertiary shadow-card">
              {t("predictions.empty")}
            </p>
          )}
          {predictions?.map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      </main>
    </>
  );
}
