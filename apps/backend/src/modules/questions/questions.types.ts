export interface CreateQuestionDTO {
  requester_name: string;
  question: string;
  requester_email: string;
  session_log_id?: number | null;
  attachment_name?: string | null;
  attachment_mime_type?: string | null;
  attachment_data?: Uint8Array | null;
}

export interface UpdateQuestionStatusDTO {
  status: "ABERTA" | "RESPONDIDA";
  answered_by_user_id?: number;
}

export interface AnsweredByUserDTO {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "SECRETARIA";
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
  status: "ABERTA" | "RESPONDIDA";
  answered_at?: string | null;
  answered_by_user?: AnsweredByUserDTO | null;
  created_at: string;
  updated_at: string;
}
