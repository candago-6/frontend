"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Filter, Loader2, MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getConversations,
  getConversationMessages,
  type ConversationSummary,
} from "@/services/conversas";
import {
  getMessageEvaluations,
  evaluateMessage,
  type EvaluationRating,
} from "@/services/messageEvaluations";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 10_000;

const STATUS_LABELS: Record<string, string> = {
  open: "Em aberto",
  closed: "Concluído",
  archived: "Arquivado",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  closed: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-slate-100 text-slate-600 border-slate-200",
};

function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConversationHistoryDialog({
  conversation,
  onOpenChange,
}: {
  conversation: ConversationSummary | null;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [showOnlyNegative, setShowOnlyNegative] = useState(false);
  const [lastConversationId, setLastConversationId] = useState(conversation?.id);

  if (conversation?.id !== lastConversationId) {
    setLastConversationId(conversation?.id);
    setShowOnlyNegative(false);
  }

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["conversation-messages", conversation?.id],
    queryFn: () => getConversationMessages(conversation!.id),
    enabled: !!conversation,
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ["message-evaluations"],
    queryFn: getMessageEvaluations,
    enabled: !!conversation,
  });

  const evaluateMutation = useMutation({
    mutationFn: ({ messageId, rating }: { messageId: number; rating: EvaluationRating }) =>
      evaluateMessage(messageId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-evaluations"] });
    },
    onError: () => toast.error("Erro ao registrar avaliação"),
  });

  const visibleMessages = showOnlyNegative
    ? messages.filter((message) => {
        const evaluation = evaluations.find((e) => e.message_id === message.id);
        return message.role === "bot" && evaluation?.rating === "negative";
      })
    : messages;

  return (
    <Dialog open={!!conversation} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{conversation?.protocol}</DialogTitle>
          <DialogDescription>
            {conversation?.clientName} · {conversation?.clientPhone}
            {conversation?.clientCpf ? ` · CPF ${maskCpf(conversation.clientCpf)}` : ""}
          </DialogDescription>
        </DialogHeader>

        {!isLoading && messages.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant={showOnlyNegative ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyNegative((v) => !v)}
              className="h-7 gap-1.5 text-xs"
            >
              <Filter className="h-3.5 w-3.5" />
              Respostas mal avaliadas
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Nenhuma mensagem registrada para este atendimento
          </p>
        ) : visibleMessages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Nenhuma resposta avaliada negativamente nesta conversa
          </p>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto py-2">
            {visibleMessages.map((message) => {
              const isUser = message.role === "user";
              const isBot = message.role === "bot";
              const evaluation = evaluations.find((e) => e.message_id === message.id);
              return (
                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      isUser ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <p>{message.content}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className={`text-[11px] ${isUser ? "text-slate-300" : "text-slate-400"}`}>
                        {formatDate(message.timestamp)}
                      </p>
                      {isBot && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={evaluateMutation.isPending}
                            onClick={() => evaluateMutation.mutate({ messageId: message.id, rating: "positive" })}
                            className={cn(
                              "h-6 w-6 text-slate-400 hover:text-green-600",
                              evaluation?.rating === "positive" && "text-green-600"
                            )}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span className="sr-only">Avaliar como positiva</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={evaluateMutation.isPending}
                            onClick={() => evaluateMutation.mutate({ messageId: message.id, rating: "negative" })}
                            className={cn(
                              "h-6 w-6 text-slate-400 hover:text-red-600",
                              evaluation?.rating === "negative" && "text-red-600"
                            )}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                            <span className="sr-only">Avaliar como negativa</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ConversasPage() {
  const [selected, setSelected] = useState<ConversationSummary | null>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations-summary"],
    queryFn: getConversations,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Conversas</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Histórico dos atendimentos realizados pelo chatbot
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-700">Nenhum atendimento registrado</p>
            <p className="mt-1 text-sm text-slate-400">
              As conversas realizadas pelo chatbot aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead className="font-medium text-slate-600">Protocolo</TableHead>
                  <TableHead className="font-medium text-slate-600">Cliente</TableHead>
                  <TableHead className="font-medium text-slate-600">Telefone</TableHead>
                  <TableHead className="font-medium text-slate-600">Status</TableHead>
                  <TableHead className="font-medium text-slate-600">Data</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conversation) => (
                  <TableRow key={conversation.id} className="border-slate-100">
                    <TableCell className="font-medium text-slate-900">{conversation.protocol}</TableCell>
                    <TableCell className="text-slate-600">{conversation.clientName}</TableCell>
                    <TableCell className="text-slate-600">{conversation.clientPhone}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_BADGE_CLASS[conversation.status] ?? STATUS_BADGE_CLASS.archived}
                      >
                        {STATUS_LABELS[conversation.status] ?? conversation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{formatDate(conversation.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSelected(conversation)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <MessageSquareText className="h-4 w-4" />
                        <span className="sr-only">Ver histórico</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ConversationHistoryDialog conversation={selected} onOpenChange={(v) => { if (!v) setSelected(null); }} />
    </div>
  );
}
