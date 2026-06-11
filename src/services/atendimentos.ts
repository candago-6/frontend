import api from "./api";
import type { Attendance } from "@/types";

const MOCK = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

interface ConversationDTO {
  id: number;
  user_id: number;
  protocol: string;
  status: string;
  created_at: string;
}

const mockConversations: ConversationDTO[] = [
  { id: 1, user_id: 1, protocol: "PROCON-1001", status: "open", created_at: "2026-06-09T13:00:00Z" },
  { id: 2, user_id: 2, protocol: "PROCON-1002", status: "open", created_at: "2026-06-10T08:30:00Z" },
  { id: 3, user_id: 3, protocol: "PROCON-1003", status: "closed", created_at: "2026-06-08T10:00:00Z" },
  { id: 4, user_id: 4, protocol: "PROCON-1004", status: "open", created_at: "2026-06-10T09:15:00Z" },
  { id: 5, user_id: 5, protocol: "PROCON-1005", status: "closed", created_at: "2026-06-07T16:45:00Z" },
];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 300));
}

function toAttendance(conversation: ConversationDTO): Attendance {
  return {
    id: String(conversation.id),
    protocol: conversation.protocol,
    status: conversation.status === "open" ? "open" : "closed",
    createdAt: conversation.created_at,
  };
}

export async function getAttendances(): Promise<Attendance[]> {
  if (MOCK) return delay(mockConversations.map(toAttendance));
  const { data } = await api.get<ConversationDTO[]>("/api/v1/conversations");
  return data.map(toAttendance);
}
