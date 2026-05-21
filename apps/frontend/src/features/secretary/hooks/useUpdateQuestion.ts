import { useMutation, useQueryClient } from "@tanstack/react-query";

import { questionsApi } from "@/features/secretary/api/questions.api";
import type { InquiryStatus } from "@/types/common.types";

import { QUESTIONS_QUERY_KEY } from "./useQuestions";

interface UpdateQuestionStatusInput {
  id: number;
  status: InquiryStatus;
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: UpdateQuestionStatusInput) =>
      questionsApi.updateStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUESTIONS_QUERY_KEY });
    },
  });
}
