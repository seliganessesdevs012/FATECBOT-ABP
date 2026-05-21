
export interface LogFiltersDTO {
  flag?: "ATENDEU" | "NAO_ATENDEU";
  from?: string; 
  to?: string; 
  page?: number; 
  limit?: number; 
}


export interface QuestionResponseDTO {
  id: number;
  question: string;
  status: "ABERTA" | "RESPONDIDA";
}


export interface SessionLogResponseDTO {
  id: number;
  navigation_flow: string[];
  flag: "ATENDEU" | "NAO_ATENDEU";
  created_at: string;
  questions: QuestionResponseDTO[];
}


export interface PaginatedLogsResponseDTO {
  data: SessionLogResponseDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}