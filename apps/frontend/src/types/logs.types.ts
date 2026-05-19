export interface InteractionLogDTO {
  id: number;
  session_log_id?: number | null;
  node_id: number;
  flag: "ATENDEU" | "NAO_ATENDEU";
  navigation_flow: string[];
  recorded_at: string; // ISO 8601
  // campos opcionais (se o backend fornecer)
  duration_seconds?: number;
  linked_questions?: Array<{ id: number; title?: string }>;
}