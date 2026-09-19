import api from "./api";

const MOCK = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

/**
 * A conta que pode parear o WhatsApp. Só controla o que aparece no menu — quem
 * decide de verdade é o backend, comparando com ADMIN_EMAIL. Mudar isto aqui não
 * dá acesso a ninguém.
 */
export const SUPER_ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ?? "admin@procon.sp.gov.br"
).toLowerCase();

export function isSuperAdmin(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export type EstadoConexao = "conectado" | "aguardando_leitura" | "iniciando";

export interface BotStatus {
  estado: EstadoConexao;
  conectado: boolean;
  qrPendente: boolean;
}

export async function getBotStatus(): Promise<BotStatus> {
  if (MOCK) {
    return { estado: "aguardando_leitura", conectado: false, qrPendente: true };
  }
  const { data } = await api.get<BotStatus>("/api/v1/bot/status");
  return data;
}

/**
 * QR de pareamento como data URL, pronto para um <img>.
 *
 * Vem como PNG binário e é convertido aqui em vez de virar object URL, para não
 * sobrar blob pendurado a cada renovação — o WhatsApp troca o código a cada
 * poucos segundos, então isso acontece bastante.
 *
 * `null` significa que não há QR pendente (o bot já está conectado), que a API
 * sinaliza com 404.
 */
export async function getBotQrCode(): Promise<string | null> {
  if (MOCK) return null;

  try {
    const { data } = await api.get<Blob>("/api/v1/bot/qr", { responseType: "blob" });
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(data);
    });
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}

export function mensagemDeErro(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 403) return "Esta página é restrita ao administrador do sistema.";
  if (status === 502) return "O serviço do WhatsApp não respondeu. Verifique se o bot está no ar.";
  return "Não foi possível falar com o serviço do WhatsApp.";
}
