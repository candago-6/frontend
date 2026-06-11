"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageSquareMore, Smile } from "lucide-react";

import { EvaluationsTable } from "@/components/dashboard/evaluations-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { getAttendances } from "@/services/atendimentos";
import { getFeedbacks, getSatisfactionPercentage } from "@/services/feedback";

const REFRESH_INTERVAL_MS = 10_000;

export default function DashboardPage() {
  const { data: attendances = [], isLoading } = useQuery({
    queryKey: ["attendances"],
    queryFn: getAttendances,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const { data: feedbacks = [], isLoading: isLoadingFeedbacks } = useQuery({
    queryKey: ["feedbacks"],
    queryFn: getFeedbacks,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const openCount = attendances.filter((a) => a.status === "open").length;
  const closedCount = attendances.filter((a) => a.status === "closed").length;
  const satisfaction = getSatisfactionPercentage(feedbacks);

  return (
    <div className="p-4 sm:p-8">
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
        <StatCard
          label="Atendimentos concluídos"
          value={String(closedCount)}
          icon={CheckCircle2}
          isLoading={isLoading}
        />
        <StatCard
          label="Satisfação dos clientes"
          value={satisfaction === null ? "—" : `${satisfaction}%`}
          icon={Smile}
          isLoading={isLoadingFeedbacks}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Avaliação de conversas</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Desempenho do chatbot avaliado pelos clientes em cada atendimento
        </p>
        <div className="mt-4">
          <EvaluationsTable
            attendances={attendances}
            feedbacks={feedbacks}
            isLoading={isLoadingFeedbacks}
          />
        </div>
      </div>
    </div>
  );
}
