import type { InquiryStatus } from "@/types/common.types";

export interface QuestionResponseDTO {
  id: number;
  requester_name: string;
  question: string;
  requester_email: string;
  session_log_id?: number | null;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}
