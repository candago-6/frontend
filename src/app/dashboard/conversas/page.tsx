"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Filter,
  Headset,
  Loader2,
  MessageSquareText,
  Send,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  takeoverConversation,
  sendAgentMessage,
  releaseConversation,
  type ConversationSummary,
} from "@/services/conversas";
import {
  getMessageEvaluations,
  evaluateMessage,
  type EvaluationRating,
} from "@/services/messageEvaluations";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 10_000;
const LIVE_REFRESH_INTERVAL_MS = 3_000;

const STATUS_LABELS: Record<string, string> = {
  open: "Em aberto",
  waiting_human: "Aguardando atendente",
  human_handover: "Em atendimento humano",
  confirming_closure: "Confirmando encerramento",
  awaiting_feedback: "Aguardando avaliação",
  closed: "Concluído",
  archived: "Arquivado",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  waiting_human: "bg-red-50 text-red-700 border-red-200",
  human_handover: "bg-amber-50 text-amber-700 border-amber-200",
  confirming_closure: "bg-slate-100 text-slate-600 border-slate-200",
  awaiting_feedback: "bg-violet-50 text-violet-700 border-violet-200",
  closed: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-slate-100 text-slate-600 border-slate-200",
};

// Lower number = higher priority in the queue.
const STATUS_ORDER: Record<string, number> = {
  waiting_human: 0,
  human_handover: 1,
  open: 2,
  confirming_closure: 3,
  awaiting_feedback: 4,
  closed: 6,
  archived: 7,
};

function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  // CPF arrives encrypted from the API (Fernet token, not 11 digits) — never render it raw.
  if (digits.length !== 11) return "";
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
  const myId = useAuthStore((s) => s.user?.id);
  const [showOnlyNegative, setShowOnlyNegative] = useState(false);
  const [draft, setDraft] = useState("");
  const [lastConversationId, setLastConversationId] = useState(conversation?.id);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isWaiting = conversation?.status === "waiting_human";
  const isHandover = conversation?.status === "human_handover";
  const isLive = isWaiting || isHandover;
  const assignee = conversation?.assignedAdminId ?? null;
  const mine = assignee === null || assignee === myId;
  const maskedCpf = conversation ? maskCpf(conversation.clientCpf) : "";

  if (conversation?.id !== lastConversationId) {
    setLastConversationId(conversation?.id);
    setShowOnlyNegative(false);
    setDraft("");
  }

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["conversation-messages", conversation?.id],
    queryFn: () => getConversationMessages(conversation!.id),
    enabled: !!conversation,
    refetchInterval: isLive ? LIVE_REFRESH_INTERVAL_MS : false,
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

  function refreshConversation() {
    queryClient.invalidateQueries({ queryKey: ["conversations-summary"] });
    queryClient.invalidateQueries({ queryKey: ["conversation-messages", conversation?.id] });
  }

  const takeoverMutation = useMutation({
    mutationFn: () => takeoverConversation(conversation!.id),
    onSuccess: () => {
      toast.success("Atendimento assumido");
      refreshConversation();
    },
    onError: () => toast.error("Não foi possível assumir (outro analista pode já ter assumido)"),
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendAgentMessage(conversation!.id, content),
    onSuccess: () => {
      setDraft("");
      refreshConversation();
    },
    onError: () => toast.error("Falha ao enviar a mensagem ao cliente"),
  });

  const releaseMutation = useMutation({
    mutationFn: (toBot: boolean) => releaseConversation(conversation!.id, toBot),
    onSuccess: (_, toBot) => {
      toast.success(
        toBot ? "Atendimento devolvido ao bot" : "Encerrado — avaliação solicitada ao cliente"
      );
      refreshConversation();
      if (!toBot) onOpenChange(false);
    },
    onError: () => toast.error("Falha ao encerrar o atendimento"),
  });

  // Keep the live transcript scrolled to the latest message.
  useEffect(() => {
    if (isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLive]);

  const visibleMessages = showOnlyNegative
    ? messages.filter((message) => {
        const evaluation = evaluations.find((e) => e.message_id === message.id);
        return message.role === "bot" && evaluation?.rating === "negative";
      })
    : messages;

  function handleSend() {
    const content = draft.trim();
    if (!content || sendMutation.isPending) return;
    sendMutation.mutate(content);
  }

  return (
    <Dialog open={!!conversation} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{conversation?.protocol}</DialogTitle>
          <DialogDescription className="break-words">
            {conversation?.clientName} · {conversation?.clientPhone}
            {maskedCpf ? ` · CPF ${maskedCpf}` : ""}
          </DialogDescription>
        </DialogHeader>

        {isWaiting && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-700">
              O cliente está aguardando um atendente humano.
            </p>
            <Button
              size="sm"
              onClick={() => takeoverMutation.mutate()}
              disabled={takeoverMutation.isPending}
              className="gap-1.5"
            >
              {takeoverMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Headset className="h-3.5 w-3.5" />
              )}
              Assumir atendimento
            </Button>
          </div>
        )}

        {!isLive && !isLoading && messages.length > 0 && (
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
          <div ref={scrollRef} className="max-h-96 space-y-2 overflow-y-auto py-2">
            {visibleMessages.map((message) => {
              const isUser = message.role === "user";
              const isBot = message.role === "bot";
              const isAgent = message.role === "agent";
              const evaluation = evaluations.find((e) => e.message_id === message.id);
              return (
                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      isUser && "bg-slate-900 text-white",
                      isBot && "bg-slate-100 text-slate-700",
                      isAgent && "bg-emerald-600 text-white",
                      !isUser && !isBot && !isAgent && "bg-slate-100 text-slate-700"
                    )}
                  >
                    {isAgent && (
                      <p className="mb-0.5 text-[11px] font-medium text-emerald-100">Atendente</p>
                    )}
                    <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-[11px]",
                          isUser ? "text-slate-300" : isAgent ? "text-emerald-100" : "text-slate-400"
                        )}
                      >
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

        {isHandover && !mine && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Este atendimento já está sendo conduzido por outro analista.
          </div>
        )}

        {isHandover && mine && (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escreva uma resposta ao cliente..."
                disabled={sendMutation.isPending}
              />
              <Button onClick={handleSend} disabled={!draft.trim() || sendMutation.isPending} size="icon">
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => releaseMutation.mutate(true)}
                disabled={releaseMutation.isPending}
              >
                Devolver ao bot
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => releaseMutation.mutate(false)}
                disabled={releaseMutation.isPending}
              >
                Encerrar atendimento
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ConversasPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations-summary"],
    queryFn: getConversations,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const sorted = [...conversations].sort((a, b) => {
    const order = (STATUS_ORDER[a.status] ?? 5) - (STATUS_ORDER[b.status] ?? 5);
    if (order !== 0) return order;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const waitingCount = conversations.filter((c) => c.status === "waiting_human").length;
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Conversas</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Histórico dos atendimentos realizados pelo chatbot
        </p>
      </div>

      {waitingCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Headset className="h-4 w-4 text-red-600" />
          <p className="text-sm font-medium text-red-700">
            {waitingCount} {waitingCount === 1 ? "cliente aguardando" : "clientes aguardando"} atendente humano
          </p>
        </div>
      )}

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
                {sorted.map((conversation) => {
                  const needsHuman = conversation.status === "waiting_human";
                  return (
                    <TableRow
                      key={conversation.id}
                      className={cn("border-slate-100", needsHuman && "bg-red-50/40")}
                    >
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
                          variant={needsHuman ? "default" : "ghost"}
                          size="icon-sm"
                          onClick={() => setSelectedId(conversation.id)}
                          className={cn(!needsHuman && "text-slate-400 hover:text-slate-700")}
                        >
                          {needsHuman ? (
                            <Headset className="h-4 w-4" />
                          ) : (
                            <MessageSquareText className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {needsHuman ? "Atender" : "Ver histórico"}
                          </span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ConversationHistoryDialog
        conversation={selected}
        onOpenChange={(v) => { if (!v) setSelectedId(null); }}
      />
    </div>
  );
}
