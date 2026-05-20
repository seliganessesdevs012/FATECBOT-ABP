import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { InteractionLogDTO } from '../types/logs.types';
import type { PaginatedResponse } from '../../../types/api.types';
import type { ListLogsParams } from '../api/logs.api';
import { logsApi } from '../api/logs.api';

export type UseLogsReturn = {
  data: InteractionLogDTO[];
  meta?: { total: number; page: number; limit: number };
  isLoading: boolean;
  isError: boolean;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  setLimit: (l: number) => void;
  filters: Partial<ListLogsParams>;
  setFilters: (f: Partial<ListLogsParams>) => void;
  refetch: () => void;
};

export function useLogs(initialFilters: Partial<ListLogsParams> = {}, initialPage = 1, initialLimit = 20): UseLogsReturn {
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [filters, setFiltersState] = useState<Partial<ListLogsParams>>(initialFilters);

  const queryKey = useMemo(() => ['logs', filters, page, limit], [filters, page, limit]);

    const query = useQuery({
      queryKey,
      queryFn: () => logsApi.list({ ...(filters as ListLogsParams), page, limit }),
    });

  const setFilters = useCallback((f: Partial<ListLogsParams>) => {
    setFiltersState(prev => ({ ...prev, ...f }));
    setPage(1); // reset page when filters change
  }, []);

  const resp = query.data as PaginatedResponse<InteractionLogDTO> | undefined;

  return {
    data: resp?.data ?? [],
    meta: resp?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    page,
    setPage,
    limit,
    setLimit,
    filters,
    setFilters,
    refetch: () => query.refetch(),
  };
}