import api from "./api";
import type { User, Role } from "@/types";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  role: Role;
}

const MOCK = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

let mockUsers: User[] = [
  { id: "1", name: "Ana Souza", email: "ana.souza@procon.sp.gov.br", role: "gestor_gerencia" },
  { id: "2", name: "Bruno Lima", email: "bruno.lima@procon.sp.gov.br", role: "gestor_analista" },
  { id: "3", name: "Carla Mendes", email: "carla.mendes@procon.sp.gov.br", role: "analista" },
];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 300));
}

export async function getUsers(): Promise<User[]> {
  if (MOCK) return delay([...mockUsers]);
  const { data } = await api.get<User[]>("/api/v1/admin-users");
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  if (MOCK) {
    const user: User = { id: String(Date.now()), name: payload.name, email: payload.email, role: payload.role };
    mockUsers = [...mockUsers, user];
    return delay(user);
  }
  const { data } = await api.post<User>("/api/v1/admin-users", payload);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  if (MOCK) {
    mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, ...payload } : u));
    return delay(mockUsers.find((u) => u.id === id)!);
  }
  const { data } = await api.put<User>(`/api/v1/admin-users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  if (MOCK) {
    mockUsers = mockUsers.filter((u) => u.id !== id);
    return delay(undefined);
  }
  await api.delete(`/api/v1/admin-users/${id}`);
}
