import api from "./api";
import type { TrendPoint } from "@/types";

const MOCK = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

interface FeedbackDTO {
  id: number;
  conversation_id: number;
  rating: number;
  comment: string | null;
  is_best_answer: boolean;
  created_at: string;
}

const mockFeedbacks: FeedbackDTO[] = [
  { id: 1, conversation_id: 1, rating: 5, comment: null, is_best_answer: true, created_at: "2026-06-09T13:10:00Z" },
  { id: 2, conversation_id: 3, rating: 4, comment: null, is_best_answer: true, created_at: "2026-06-08T10:05:00Z" },
  { id: 3, conversation_id: 5, rating: 3, comment: null, is_best_answer: false, created_at: "2026-06-07T16:50:00Z" },
];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 300));
}

export async function getFeedbacks(): Promise<FeedbackDTO[]> {
  if (MOCK) return delay(mockFeedbacks);
  const { data } = await api.get<FeedbackDTO[]>("/api/v1/feedback");
  return data;
}

export function getSatisfactionPercentage(feedbacks: FeedbackDTO[]): number | null {
  if (feedbacks.length === 0) return null;
  const sum = feedbacks.reduce((total, f) => total + f.rating, 0);
  const average = sum / feedbacks.length;
  return Math.round((average / 5) * 100);
}

export function getSatisfactionTrend(feedbacks: FeedbackDTO[]): TrendPoint[] {
  const byDate = new Map<string, { sum: number; count: number }>();
  for (const f of feedbacks) {
    const date = f.created_at.slice(0, 10);
    const entry = byDate.get(date) ?? { sum: 0, count: 0 };
    entry.sum += f.rating;
    entry.count += 1;
    byDate.set(date, entry);
  }
  return Array.from(byDate.entries())
    .map(([date, { sum, count }]) => ({ date, value: Math.round((sum / count / 5) * 100) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type EvaluationLabel = "positive" | "negative";

export function getEvaluationLabel(feedback: FeedbackDTO): EvaluationLabel {
  return feedback.rating >= 4 ? "positive" : "negative";
}

export type { FeedbackDTO };
