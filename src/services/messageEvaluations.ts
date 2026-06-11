import api from "./api";
import type { TrendPoint } from "@/types";

const MOCK = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

export type EvaluationRating = "positive" | "negative";

export interface MessageEvaluation {
  id: number;
  message_id: number;
  admin_user_id: string;
  rating: EvaluationRating;
  created_at: string;
}

let mockEvaluations: MessageEvaluation[] = [];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 300));
}

export async function getMessageEvaluations(): Promise<MessageEvaluation[]> {
  if (MOCK) return delay([...mockEvaluations]);
  const { data } = await api.get<MessageEvaluation[]>("/api/v1/message-evaluations");
  return data;
}

export function getPositiveRatePercentage(evaluations: MessageEvaluation[]): number | null {
  if (evaluations.length === 0) return null;
  const positive = evaluations.filter((e) => e.rating === "positive").length;
  return Math.round((positive / evaluations.length) * 100);
}

export function getPositiveRateTrend(evaluations: MessageEvaluation[]): TrendPoint[] {
  const byDate = new Map<string, { positive: number; total: number }>();
  for (const e of evaluations) {
    const date = e.created_at.slice(0, 10);
    const entry = byDate.get(date) ?? { positive: 0, total: 0 };
    entry.total += 1;
    if (e.rating === "positive") entry.positive += 1;
    byDate.set(date, entry);
  }
  return Array.from(byDate.entries())
    .map(([date, { positive, total }]) => ({ date, value: Math.round((positive / total) * 100) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function evaluateMessage(messageId: number, rating: EvaluationRating): Promise<MessageEvaluation> {
  if (MOCK) {
    const existing = mockEvaluations.find((e) => e.message_id === messageId);
    if (existing) {
      existing.rating = rating;
      return delay(existing);
    }
    const evaluation: MessageEvaluation = {
      id: Date.now(),
      message_id: messageId,
      admin_user_id: "1",
      rating,
      created_at: new Date().toISOString(),
    };
    mockEvaluations = [...mockEvaluations, evaluation];
    return delay(evaluation);
  }
  const { data } = await api.put<MessageEvaluation>(`/api/v1/messages/${messageId}/evaluation`, { rating });
  return data;
}
