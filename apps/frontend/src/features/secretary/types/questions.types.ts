import type { InquiryStatus, Role } from "@/types/common.types";

export interface AnsweredByUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface QuestionResponseDTO {
  id: number;
  requester_name: string;
  question: string;
  requester_email: string;
  session_log_id?: number | null;
  attachment_name?: string | null;
  attachment_mime_type?: string | null;
  attachment_size_bytes?: number | null;
  has_attachment: boolean;
  status: InquiryStatus;
  answered_at?: string | null;
  answered_by_user?: AnsweredByUser | null;
  created_at: string;
  updated_at: string;
}
