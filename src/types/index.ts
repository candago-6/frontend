export type Role = "gestor" | "analista";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Attendance {
  id: string;
  protocol: string;
  status: "open" | "closed";
  createdAt: string;
  closedAt?: string;
  satisfactionScore?: number;
}

export interface ConversationEvaluation {
  id: string;
  attendanceId: string;
  rating: "positive" | "negative";
  evaluatedAt: string;
}
