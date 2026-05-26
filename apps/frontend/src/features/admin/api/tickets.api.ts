import { env } from "@/config/env";
import { api } from "@/lib/axios";
import { mockBackend } from "@/mocks/dev/mockBackend";
import type { PaginatedResponse } from "@/types/api.types";
import type { InquiryStatus } from "@/types/common.types";
import type {
  AnsweredByUser,
  QuestionResponseDTO,
} from "@/features/secretary/types/questions.types";

export interface AdminTicket {
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

export interface ListTicketsParams {
  status?: InquiryStatus;
  page?: number;
  limit?: number;
}

export type TicketsListResponse = PaginatedResponse<AdminTicket>;

export const ticketsApi = {
  async list(params: ListTicketsParams = {}): Promise<TicketsListResponse> {
    if (env.VITE_USE_MOCKS === "true") {
      return mockBackend.questions.list(params) as Promise<
        PaginatedResponse<QuestionResponseDTO>
      >;
    }

    const response = await api.get<TicketsListResponse>("/questions", { params });
    return response.data;
  },

  async updateStatus(id: number, status: InquiryStatus): Promise<AdminTicket> {
    if (env.VITE_USE_MOCKS === "true") {
      return mockBackend.questions.updateStatus(id, status);
    }

    const response = await api.patch<{ success: boolean; data: AdminTicket }>(
      `/questions/${id}`,
      { status },
    );

    return response.data.data;
  },

  async downloadAttachment(id: number): Promise<Blob> {
    if (env.VITE_USE_MOCKS === "true") {
      return mockBackend.questions.downloadAttachment(id);
    }

    const response = await api.get<Blob>(`/questions/${id}/attachment`, {
      responseType: "blob",
    });

    return response.data;
  },
};
