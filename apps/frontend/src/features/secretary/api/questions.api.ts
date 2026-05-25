import { api } from '@/lib/axios';
import { env } from '@/config/env';
import { mockBackend } from '@/mocks/dev/mockBackend';
import type { PaginatedResponse } from '@/types/api.types';
import type { InquiryStatus } from '@/types/common.types';
import type { QuestionResponseDTO } from '@/features/secretary/types/questions.types';

export type ListParams = { status?: InquiryStatus; page?: number; limit?: number };

export const questionsApi = {
  async list(params?: ListParams): Promise<PaginatedResponse<QuestionResponseDTO>> {
    if (env.VITE_USE_MOCKS === "true") {
      return mockBackend.questions.list(params);
    }

    const response = await api.get<PaginatedResponse<QuestionResponseDTO>>('/questions', { params });
    return response.data;
  },

  async updateStatus(id: number, status: InquiryStatus): Promise<QuestionResponseDTO> {
    if (env.VITE_USE_MOCKS === "true") {
      return mockBackend.questions.updateStatus(id, status);
    }

    const response = await api.patch<{ success: boolean; data: QuestionResponseDTO }>(`/questions/${id}`, { status });
    return response.data.data;
  },
};
