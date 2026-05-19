import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionsApi } from '@/features/secretary/api/questions.api';
import type { PaginatedResponse } from '@/types/api.types';
import type { QuestionResponseDTO } from '@/features/secretary/types/questions.types';
import type { InquiryStatus } from '@/types/common.types';

export type ListParams = { status?: InquiryStatus; limit?: number };

export function useQuestions(params?: ListParams) {
  const queryClient = useQueryClient();
  const limit = params?.limit ?? 10;
  const status = params?.status;

  const queryKey = ['questions', { status, limit }];

  const query = useInfiniteQuery<PaginatedResponse<QuestionResponseDTO>>(
    queryKey,
    async ({ pageParam = 1 }) => {
      return questionsApi.list({ status, page: pageParam, limit });
    },
    {
      getNextPageParam: (lastPage) => {
        // assume meta: { page, lastPage }
        const meta = (lastPage as any).meta;
        if (!meta) return undefined;
        return meta.page < meta.lastPage ? meta.page + 1 : undefined;
      },
      keepPreviousData: true,
      staleTime: 1000 * 30,
    }
  );

  const updateStatusMutation = useMutation(
    async ({ id, status }: { id: number; status: InquiryStatus }) =>
      questionsApi.updateStatus(id, status),
    {
      onSuccess: () => {
        // Invalidate queries so UI refetches updated list
        queryClient.invalidateQueries(queryKey);
        queryClient.invalidateQueries(['questions']); // broader invalidate
      },
    }
  );

  const items = query.data?.pages.flatMap(p => (p as any).data ?? []) ?? [];

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
      isLoading: updateStatusMutation.isLoading,
      isError: updateStatusMutation.isError,
    },
  };
}