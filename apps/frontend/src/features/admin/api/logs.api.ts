// ...existing code...
import { api } from '../../../lib/axios';
import type { PaginatedResponse } from '../../../types/api.types';
import type { InteractionLogDTO } from '../types/logs.types';


export type ListLogsParams = {
  flag?: 'ATENDEU' | 'NAO_ATENDEU';
  from?: string; 
  to?: string;   
  page?: number;
  limit?: number;
};

export const logsApi = {
  async list(params: ListLogsParams = {}): Promise<PaginatedResponse<InteractionLogDTO>> {
    const { page = 1, limit = 20, ...rest } = params;
    // tipagem mais restrita para evitar 'any'
    const query: Record<string, string | number> = { ...(rest as Record<string, string | number>), page, limit };

    // remove undefined/null/empty
    Object.keys(query).forEach((k) => {
      if (query[k] === undefined || query[k] === null || query[k] === '') {
        delete query[k];
      }
    });

    const response = await api.get<PaginatedResponse<InteractionLogDTO>>('/api/v1/logs', { params: query });
    return response.data;
  },
};
// ...existing code...