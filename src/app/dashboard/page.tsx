"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageSquareMore } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { getAttendances } from "@/services/atendimentos";

const REFRESH_INTERVAL_MS = 10_000;

export default function DashboardPage() {
  const { data: attendances = [], isLoading } = useQuery({
    queryKey: ["attendances"],
    queryFn: getAttendances,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const openCount = attendances.filter((a) => a.status === "open").length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Acompanhamento</h1>
        <p className="mt-0.5 text-sm text-slate-500">Visão geral dos atendimentos da plataforma</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Atendimentos em aberto"
          value={String(openCount)}
          icon={MessageSquareMore}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
