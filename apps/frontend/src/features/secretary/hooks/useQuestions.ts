import { useQuery } from "@tanstack/react-query";

import { questionsApi } from "@/features/secretary/api/questions.api";
import type { InquiryStatus } from "@/types/common.types";

import type { QuestionResponseDTO } from "../types/questions.types";

export type ListParams = {
  status?: InquiryStatus;
  page?: number;
  limit?: number;
};

const QUESTIONS_QUERY_KEY = ["questions"] as const;

export function useQuestions(params?: ListParams) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const status = params?.status;
  const queryKey = [...QUESTIONS_QUERY_KEY, { status, page, limit }] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => questionsApi.list({ status, page, limit }),
    staleTime: 1000 * 30,
  });

  return {
    items: query.data?.data ?? ([] as QuestionResponseDTO[]),
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

export { QUESTIONS_QUERY_KEY };
