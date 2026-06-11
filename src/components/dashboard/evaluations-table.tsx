import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEvaluationLabel, type FeedbackDTO } from "@/services/feedback";
import type { Attendance } from "@/types";

const EVALUATION_LABELS: Record<"positive" | "negative", string> = {
  positive: "Positivo",
  negative: "Negativo",
};

const EVALUATION_BADGE_CLASS: Record<"positive" | "negative", string> = {
  positive: "bg-green-50 text-green-700 border-green-200",
  negative: "bg-red-50 text-red-700 border-red-200",
};

const EVALUATION_ICON: Record<"positive" | "negative", typeof ThumbsUp> = {
  positive: ThumbsUp,
  negative: ThumbsDown,
};

interface EvaluationRow {
  id: number;
  protocol: string;
  rating: number;
  comment: string | null;
}

function buildRows(attendances: Attendance[], feedbacks: FeedbackDTO[]): EvaluationRow[] {
  const protocolByConversationId = new Map(attendances.map((a) => [a.id, a.protocol]));

  return feedbacks.map((feedback) => ({
    id: feedback.id,
    protocol: protocolByConversationId.get(String(feedback.conversation_id)) ?? `#${feedback.conversation_id}`,
    rating: feedback.rating,
    comment: feedback.comment,
  }));
}

export function EvaluationsTable({
  attendances,
  feedbacks,
  isLoading,
}: {
  attendances: Attendance[];
  feedbacks: FeedbackDTO[];
  isLoading?: boolean;
}) {
  const rows = buildRows(attendances, feedbacks);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-slate-700">Nenhuma avaliação registrada</p>
          <p className="mt-1 text-sm text-slate-400">
            As avaliações dos clientes sobre o atendimento aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="font-medium text-slate-600">Protocolo</TableHead>
                <TableHead className="font-medium text-slate-600">Nota</TableHead>
                <TableHead className="font-medium text-slate-600">Avaliação</TableHead>
                <TableHead className="font-medium text-slate-600">Comentário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const evaluation = getEvaluationLabel({ rating: row.rating } as FeedbackDTO);
                const Icon = EVALUATION_ICON[evaluation];
                return (
                  <TableRow key={row.id} className="border-slate-100">
                    <TableCell className="font-medium text-slate-900">{row.protocol}</TableCell>
                    <TableCell className="text-slate-600">{row.rating}/5</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${EVALUATION_BADGE_CLASS[evaluation]}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {EVALUATION_LABELS[evaluation]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{row.comment ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
