"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendPoint } from "@/types";

function formatDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

function mergeTrends(satisfaction: TrendPoint[], accuracy: TrendPoint[]) {
  const dates = new Set([...satisfaction.map((p) => p.date), ...accuracy.map((p) => p.date)]);
  const satisfactionMap = new Map(satisfaction.map((p) => [p.date, p.value]));
  const accuracyMap = new Map(accuracy.map((p) => [p.date, p.value]));
  return Array.from(dates)
    .sort()
    .map((date) => ({
      date: formatDate(date),
      satisfacao: satisfactionMap.get(date),
      acuraciaLLM: accuracyMap.get(date),
    }));
}

export function TrendChart({
  satisfaction,
  accuracy,
}: {
  satisfaction: TrendPoint[];
  accuracy: TrendPoint[];
}) {
  const data = mergeTrends(satisfaction, accuracy);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
        Sem dados suficientes para exibir a tendência
      </div>
    );
  }

  return (
    <div className="h-64 rounded-xl border border-slate-200 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" />
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
          <Line type="monotone" dataKey="satisfacao" name="Satisfação" stroke="#16a34a" strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="acuraciaLLM" name="Acurácia LLM" stroke="#2563eb" strokeWidth={2} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
