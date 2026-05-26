import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ticketsApi } from "@/features/admin/api/tickets.api";
import type { InquiryStatus } from "@/types/common.types";

import { TICKETS_QUERY_KEY } from "./useTickets";

interface UpdateTicketStatusInput {
  id: number;
  status: InquiryStatus;
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: UpdateTicketStatusInput) =>
      ticketsApi.updateStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
}
