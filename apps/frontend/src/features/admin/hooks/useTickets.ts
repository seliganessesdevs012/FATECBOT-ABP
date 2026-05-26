import { useQuery } from "@tanstack/react-query";

import { ticketsApi, type AdminTicket } from "@/features/admin/api/tickets.api";
import type { InquiryStatus } from "@/types/common.types";

export type ListTicketsParams = {
  status?: InquiryStatus;
  page?: number;
  limit?: number;
};

export const TICKETS_QUERY_KEY = ["admin", "tickets"] as const;

export function useTickets(params?: ListTicketsParams) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const status = params?.status;

  const query = useQuery({
    queryKey: [...TICKETS_QUERY_KEY, { status, page, limit }],
    queryFn: () => ticketsApi.list({ status, page, limit }),
    staleTime: 1000 * 30,
  });

  return {
    items: query.data?.data ?? ([] as AdminTicket[]),
    meta: query.data?.meta ?? {
      total: 0,
      page,
      limit,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
