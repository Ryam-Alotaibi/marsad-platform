"use client";

import { useEffect, useState } from "react";
import { fetchPredictions, type Prediction } from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { PredictionCard } from "@/components/prediction-card";
import { t } from "@/i18n/t";

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);

  useEffect(() => {
    fetchPredictions().then(setPredictions);
  }, []);

  return (
    <>
      <Topbar title={t("predictions.title")} />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
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
