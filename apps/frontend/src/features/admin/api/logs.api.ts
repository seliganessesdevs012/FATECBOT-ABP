import { api } from "@/lib/axios";
import { env } from "@/config/env";
import { mockBackend } from "@/mocks/dev/mockBackend";
import type { PaginatedResponse } from "@/types/api.types";
import type { Satisfaction } from "@/types/common.types";

export interface SessionLogListItemDTO {
  id: number;
  navigation_flow: string[];
  flag: Satisfaction;
  created_at: string;
}

export interface ListLogsParams {
  flag?: Satisfaction;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export type LogsListResponse = PaginatedResponse<SessionLogListItemDTO>;

export const logsApi = {
  async list(params: ListLogsParams = {}): Promise<LogsListResponse> {
    if (env.VITE_USE_MOCKS === "true") {
      return mockBackend.logs.list(params);
    }

    const response = await api.get<LogsListResponse>("/logs", { params });
    return response.data;
  },
};
