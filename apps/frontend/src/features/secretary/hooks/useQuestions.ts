import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { questionsApi } from "@/features/secretary/api/questions.api";
import type { PaginatedResponse } from "@/types/api.types";
import type { InquiryStatus } from "@/types/common.types";

import type { QuestionResponseDTO } from "../types/questions.types";

export type ListParams = { status?: InquiryStatus; limit?: number };

interface UpdateQuestionStatusInput {
  id: number;
  status: InquiryStatus;
}

const QUESTIONS_QUERY_KEY = ["questions"] as const;

export function useQuestions(params?: ListParams) {
  const queryClient = useQueryClient();
  const limit = params?.limit ?? 10;
  const status = params?.status;
  const queryKey = [...QUESTIONS_QUERY_KEY, { status, limit }] as const;

  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    queryFn: ({ pageParam }): Promise<PaginatedResponse<QuestionResponseDTO>> =>
      questionsApi.list({ status, page: pageParam, limit }),
    getNextPageParam: lastPage => {
      const loadedItems = lastPage.meta.page * lastPage.meta.limit;
      return loadedItems < lastPage.meta.total
        ? lastPage.meta.page + 1
        : undefined;
    },
    staleTime: 1000 * 30,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: UpdateQuestionStatusInput) =>
      questionsApi.updateStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY });
    },
  });

  const items = query.data?.pages.flatMap(page => page.data) ?? [];

  return {
    items,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    refetch: query.refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    updateStatusState: {
      isLoading: updateStatusMutation.isPending,
      isError: updateStatusMutation.isError,
    },
  };
}
