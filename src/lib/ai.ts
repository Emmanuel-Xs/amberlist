import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

export interface AiStatus {
  enabled: boolean
  limit: number
  remaining: number
}
export interface ExtractedTask {
  title: string
  date?: string
  priority?: 'low' | 'medium' | 'high'
}

export const aiStatusKey = ['ai-status'] as const

/** Whether the server has an AI key. Every AI button hides while this is false or loading. */
export function useAiStatus() {
  return useQuery({
    queryKey: aiStatusKey,
    queryFn: () => api<AiStatus>('/ai/status'),
    staleTime: 5 * 60_000,
    retry: false,
  })
}

/** Keeps the "N left today" count in step after each call. */
export function useAiRemaining() {
  const qc = useQueryClient()
  return (remaining: number) =>
    qc.setQueryData<AiStatus>(aiStatusKey, (s) => s && { ...s, remaining })
}

export const breakdownTask = (taskId: string) =>
  api<{ subtasks: string[]; remaining: number }>('/ai/breakdown', {
    method: 'POST',
    json: { taskId },
  })

export const extractTasks = (text: string, today: string) =>
  api<{ tasks: ExtractedTask[]; remaining: number }>('/ai/extract', {
    method: 'POST',
    json: { text: text.slice(0, 4000), today },
  })
