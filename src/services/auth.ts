import api from "./api";
import type { User } from "@/types";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
    return {
      token: "mock-token-dev",
      user: { id: "1", name: "Admin Dev", email: payload.email, role: "gestor" },
    };
  }
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}
