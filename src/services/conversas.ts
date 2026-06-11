import api from "./api";

const MOCK = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

interface ConversationDTO {
  id: number;
  user_id: number;
  protocol: string;
  status: string;
  created_at: string;
}

interface ClienteDTO {
  id: number;
  name: string;
  cpf: string;
  phone: string;
}

interface MessageDTO {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  timestamp: string;
}

export interface ConversationSummary {
  id: number;
  protocol: string;
  status: string;
  createdAt: string;
  clientName: string;
  clientPhone: string;
  clientCpf: string;
}

export interface ConversationMessage {
  id: number;
  role: string;
  content: string;
  timestamp: string;
}

const mockConversations: ConversationDTO[] = [
  { id: 1, user_id: 1, protocol: "PROCON-1001", status: "open", created_at: "2026-06-09T13:00:00Z" },
  { id: 2, user_id: 2, protocol: "PROCON-1002", status: "open", created_at: "2026-06-10T08:30:00Z" },
  { id: 3, user_id: 3, protocol: "PROCON-1003", status: "closed", created_at: "2026-06-08T10:00:00Z" },
];

const mockClientes: ClienteDTO[] = [
  { id: 1, name: "Cliente WhatsApp", cpf: "", phone: "5512991234567" },
  { id: 2, name: "Cliente WhatsApp", cpf: "", phone: "5512998765432" },
  { id: 3, name: "Maria Souza", cpf: "123.456.789-00", phone: "5512990001111" },
];

const mockMessages: MessageDTO[] = [
  { id: 1, conversation_id: 1, role: "user", content: "Olá, preciso de ajuda procon", timestamp: "2026-06-09T13:00:05Z" },
  { id: 2, conversation_id: 1, role: "bot", content: "Olá! Sou o assistente virtual do Procon Jacareí. Como posso ajudar?", timestamp: "2026-06-09T13:00:08Z" },
  { id: 3, conversation_id: 3, role: "user", content: "Quero registrar uma reclamação procon", timestamp: "2026-06-08T10:00:05Z" },
  { id: 4, conversation_id: 3, role: "bot", content: "Claro, me conte os detalhes da sua reclamação.", timestamp: "2026-06-08T10:00:10Z" },
];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 300));
}

function toSummary(conversation: ConversationDTO, clientes: ClienteDTO[]): ConversationSummary {
  const cliente = clientes.find((c) => c.id === conversation.user_id);
  return {
    id: conversation.id,
    protocol: conversation.protocol,
    status: conversation.status,
    createdAt: conversation.created_at,
    clientName: cliente?.name ?? "—",
    clientPhone: cliente?.phone ?? "—",
    clientCpf: cliente?.cpf ?? "",
  };
}

export async function getConversations(): Promise<ConversationSummary[]> {
  if (MOCK) return delay(mockConversations.map((c) => toSummary(c, mockClientes)));

  const [{ data: conversations }, { data: clientes }] = await Promise.all([
    api.get<ConversationDTO[]>("/api/v1/conversations"),
    api.get<ClienteDTO[]>("/api/v1/users"),
  ]);

  return conversations
    .map((c) => toSummary(c, clientes))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getConversationMessages(conversationId: number): Promise<ConversationMessage[]> {
  if (MOCK) {
    return delay(
      mockMessages
        .filter((m) => m.conversation_id === conversationId)
        .map(({ id, role, content, timestamp }) => ({ id, role, content, timestamp }))
    );
  }

  const { data } = await api.get<MessageDTO[]>("/api/v1/messages");
  return data
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(({ id, role, content, timestamp }) => ({ id, role, content, timestamp }));
}
