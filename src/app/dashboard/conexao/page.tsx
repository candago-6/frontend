"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import {
  getBotQrCode,
  getBotStatus,
  isSuperAdmin,
  mensagemDeErro,
  type EstadoConexao,
} from "@/services/bot";

// O WhatsApp troca o código a cada poucos segundos; abaixo disso o usuário
// escaneia um QR já vencido e a leitura falha sem dizer por quê.
const QR_REFRESH_MS = 20_000;
const STATUS_REFRESH_MS = 5_000;

const ESTADO_LABEL: Record<EstadoConexao, string> = {
  conectado: "Conectado",
  aguardando_leitura: "Aguardando leitura do QR",
  iniciando: "Iniciando",
};

const ESTADO_CLASSE: Record<EstadoConexao, string> = {
  conectado: "border-green-200 bg-green-50 text-green-700",
  aguardando_leitura: "border-amber-200 bg-amber-50 text-amber-700",
  iniciando: "border-slate-200 bg-slate-50 text-slate-600",
};

export default function ConexaoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const email = useAuthStore((s) => s.user?.email);
  const autorizado = isSuperAdmin(email);

  // O backend é quem barra de verdade; isto só evita mostrar uma tela que viria
  // vazia com 403 para quem não é o administrador do sistema.
  useEffect(() => {
    if (email && !autorizado) router.replace("/dashboard");
  }, [email, autorizado, router]);

  const {
    data: status,
    isLoading: carregandoStatus,
    error: erroStatus,
  } = useQuery({
    queryKey: ["bot-status"],
    queryFn: getBotStatus,
    enabled: autorizado,
    refetchInterval: STATUS_REFRESH_MS,
    retry: false,
  });

  const conectado = status?.conectado === true;

  const {
    data: qr,
    isLoading: carregandoQr,
    error: erroQr,
  } = useQuery({
    queryKey: ["bot-qr"],
    queryFn: getBotQrCode,
    enabled: autorizado && !conectado,
    refetchInterval: conectado ? false : QR_REFRESH_MS,
    retry: false,
  });

  if (!autorizado) return null;

  const erro = erroStatus ?? erroQr;

  function atualizar() {
    queryClient.invalidateQueries({ queryKey: ["bot-status"] });
    queryClient.invalidateQueries({ queryKey: ["bot-qr"] });
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Conexão do WhatsApp</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Parear o número de atendimento com o assistente
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={atualizar} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>

      {status && (
        <div
          className={cn(
            "mb-5 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
            ESTADO_CLASSE[status.estado]
          )}
        >
          {status.estado === "conectado" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {ESTADO_LABEL[status.estado]}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {erro ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm font-medium text-slate-700">{mensagemDeErro(erro)}</p>
            <Button variant="outline" size="sm" onClick={atualizar}>
              Tentar novamente
            </Button>
          </div>
        ) : carregandoStatus || (carregandoQr && !conectado) ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : conectado ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
            <p className="text-sm font-medium text-slate-900">
              O assistente está conectado ao WhatsApp
            </p>
            <p className="max-w-md text-sm text-slate-500">
              Não é preciso fazer nada. Um novo QR só aparece aqui se a sessão cair ou se o
              aparelho for desconectado pelo WhatsApp.
            </p>
          </div>
        ) : qr ? (
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
            <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt="QR Code para conectar o WhatsApp"
                width={272}
                height={272}
                className="h-[272px] w-[272px]"
              />
            </div>

            <div className="max-w-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Smartphone className="h-4 w-4" />
                Como conectar
              </h2>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <span className="font-medium text-slate-900">1.</span> Abra o WhatsApp no
                  celular que será o número de atendimento.
                </li>
                <li>
                  <span className="font-medium text-slate-900">2.</span> Toque em{" "}
                  <span className="font-medium text-slate-900">
                    Dispositivos conectados → Conectar dispositivo
                  </span>
                  .
                </li>
                <li>
                  <span className="font-medium text-slate-900">3.</span> Aponte a câmera para o
                  código ao lado.
                </li>
              </ol>
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                O código se renova sozinho a cada 20 segundos. Se a leitura falhar, espere o
                próximo aparecer e tente de novo.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm font-medium text-slate-700">Gerando o código…</p>
            <p className="max-w-md text-sm text-slate-500">
              O assistente está iniciando. O QR aparece aqui em alguns segundos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
