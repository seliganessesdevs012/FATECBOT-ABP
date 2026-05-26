import { useQuery } from "@tanstack/react-query";

import {
  logsApi,
  type ListLogsParams,
  type SessionLogListItemDTO,
} from "@/features/admin/api/logs.api";

export interface UseLogsResult {
  logs: SessionLogListItemDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export function useLogs(params: ListLogsParams = {}): UseLogsResult {
  const normalizedParams = {
    page: params.page ?? DEFAULT_PAGE,
    limit: params.limit ?? DEFAULT_LIMIT,
    flag: params.flag,
    from: params.from,
    to: params.to,
  };

  const query = useQuery({
    queryKey: [
      "admin",
      "logs",
      normalizedParams.page,
      normalizedParams.limit,
      normalizedParams.flag ?? "all",
      normalizedParams.from ?? "all",
      normalizedParams.to ?? "all",
    ],
    queryFn: () => logsApi.list(normalizedParams),
  });

  return {
    logs: query.data?.data ?? [],
    meta: query.data?.meta ?? {
      total: 0,
      page: normalizedParams.page,
      limit: normalizedParams.limit,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
