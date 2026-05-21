import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { CheckCheck, Filter, Mail, MessageSquareText } from "lucide-react";

import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InquiryStatus } from "@/types/common.types";
import { formatDateTime } from "@/utils/date.utils";

import QuestionStatusBadge from "./QuestionStatusBadge";
import { useQuestions } from "../hooks/useQuestions";
import { useUpdateQuestion } from "../hooks/useUpdateQuestion";
import type { QuestionResponseDTO } from "../types/questions.types";

const PAGE_SIZE = 20;

type StatusFilter = InquiryStatus | "TODAS";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "TODAS", label: "Todas" },
  { value: "ABERTA", label: "Abertas" },
  { value: "RESPONDIDA", label: "Respondidas" },
];

const FILTER_STATUS_COPY: Record<StatusFilter, string> = {
  TODAS: "Todas as perguntas",
  ABERTA: "Abertas",
  RESPONDIDA: "Respondidas",
};

export interface QuestionListProps {
  className?: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data) {
      const message = data.message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const getQuestionSummary = (question: QuestionResponseDTO): string =>
  question.status === "ABERTA"
    ? "Aguardando retorno externo da secretaria."
    : `Marcada como respondida em ${formatDateTime(question.updated_at)}.`;

const QuestionList = ({ className }: QuestionListProps) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODAS");
  const [page, setPage] = useState(1);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

  const apiStatusFilter =
    statusFilter === "TODAS" ? undefined : statusFilter;
  const { items, meta, isLoading, isError, error, refetch, isFetching } =
    useQuestions({
      status: apiStatusFilter,
      page,
      limit: PAGE_SIZE,
    });
  const updateQuestionMutation = useUpdateQuestion();

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  const isUpdating = updateQuestionMutation.isPending;
  const updateErrorMessage = updateQuestionMutation.isError
    ? getErrorMessage(
        updateQuestionMutation.error,
        "Nao foi possivel atualizar o status da pergunta.",
      )
    : null;

  const resultsLabel = useMemo(() => {
    if (meta.total === 0) {
      return "Nenhuma pergunta encontrada.";
    }

    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);

    return `Exibindo ${start}-${end} de ${meta.total} pergunta(s).`;
  }, [meta.limit, meta.page, meta.total]);

  const handleFilterChange = (nextFilter: StatusFilter) => {
    setStatusFilter(nextFilter);
    setPage(1);
  };

  const handleMarkAsAnswered = async (questionId: number) => {
    setActiveQuestionId(questionId);

    try {
      await updateQuestionMutation.mutateAsync({
        id: questionId,
        status: "RESPONDIDA",
      });
    } finally {
      setActiveQuestionId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando perguntas..." />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Erro ao carregar perguntas"
        message={getErrorMessage(error, "Tente novamente em instantes.")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <section className={cn("space-y-5", className)}>
      <header className="rounded-[28px] border border-[#E3D8CA] bg-white p-5 shadow-[0_18px_40px_rgba(92,53,12,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F6EFE4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A6548]">
              <Filter className="size-3.5" aria-hidden="true" />
              Fila de atendimento
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1C262E]">
                Perguntas recebidas
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6E6252]">
                Use o filtro para priorizar a fila e marque como respondidas as
                perguntas ja tratadas fora da plataforma.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-[#FCF8F2] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7E6C]">
                Status atual
              </p>
              <p className="mt-2 text-sm font-semibold text-[#1C262E]">
                {FILTER_STATUS_COPY[statusFilter]}
              </p>
              <p className="mt-1 text-xs text-[#6E6252]">{resultsLabel}</p>
            </div>
            <div className="rounded-[22px] bg-[#FCF8F2] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7E6C]">
                Operacao
              </p>
              <p className="mt-2 text-sm text-[#1C262E]">
                A resposta ao aluno acontece por e-mail fora do sistema.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map(option => {
            const isActive = option.value === statusFilter;

            return (
              <Button
                key={option.value}
                type="button"
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  !isActive &&
                    "border-[#DCCFBC] bg-white text-[#4D4337] hover:bg-[#F6EFE4]",
                )}
                onClick={() => handleFilterChange(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </header>

      {updateErrorMessage ? (
        <ErrorAlert
          title="Erro ao atualizar pergunta"
          message={updateErrorMessage}
          dismissible
          onDismiss={() => updateQuestionMutation.reset()}
        />
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#D8C9B3] bg-[#FFFDF9] px-6 py-12 text-center shadow-[0_18px_40px_rgba(92,53,12,0.04)]">
          <p className="text-lg font-semibold text-[#1C262E]">
            Nenhuma pergunta para este filtro.
          </p>
          <p className="mt-2 text-sm text-[#6E6252]">
            Ajuste o status selecionado para revisar outro recorte da fila.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-[#E3D8CA] bg-white shadow-[0_18px_40px_rgba(92,53,12,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#FBF7F1] text-xs uppercase tracking-[0.12em] text-[#8C7E6C]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Solicitante</th>
                  <th className="px-5 py-4 font-semibold">Pergunta</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Criada em</th>
                  <th className="px-5 py-4 text-right font-semibold">Acao</th>
                </tr>
              </thead>
              <tbody>
                {items.map(question => {
                  const isOpen = question.status === "ABERTA";
                  const isRowBusy =
                    isUpdating && activeQuestionId === question.id;

                  return (
                    <tr
                      key={question.id}
                      className={cn(
                        "border-t border-[#EFE5D9] align-top transition-colors",
                        isOpen ? "bg-[#FFF9ED]" : "bg-white",
                      )}
                    >
                      <td className="px-5 py-5">
                        <div className="space-y-2">
                          <p className="font-semibold text-[#1C262E]">
                            {question.requester_name}
                          </p>
                          <div className="space-y-1 text-xs text-[#6E6252]">
                            <p className="inline-flex items-center gap-2">
                              <Mail className="size-3.5" aria-hidden="true" />
                              {question.requester_email}
                            </p>
                            {question.session_log_id ? (
                              <p>Atendimento vinculado: #{question.session_log_id}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <div className="space-y-2">
                          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7E6C]">
                            <MessageSquareText
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Conteudo
                          </p>
                          <p className="max-w-xl leading-relaxed text-[#2B2B2B]">
                            {question.question}
                          </p>
                          <p className="text-xs text-[#6E6252]">
                            {getQuestionSummary(question)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <QuestionStatusBadge status={question.status} />
                      </td>
                      <td className="px-5 py-5 text-[#4D4337]">
                        <p>{formatDateTime(question.created_at)}</p>
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleMarkAsAnswered(question.id)}
                            disabled={!isOpen || isUpdating}
                            className={cn(
                              "min-w-[162px]",
                              !isOpen &&
                                "bg-[#E8F2EA] text-[#2E6A4F] hover:bg-[#E8F2EA]",
                            )}
                          >
                            <CheckCheck className="size-4" aria-hidden="true" />
                            {isOpen
                              ? isRowBusy
                                ? "Atualizando..."
                                : "Marcar respondida"
                              : "Ja respondida"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer className="flex flex-col gap-3 rounded-[24px] border border-[#E3D8CA] bg-[#F8F3EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6E6252]">
          {isFetching ? "Atualizando dados..." : resultsLabel}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage(current => Math.max(1, current - 1))}
            disabled={!hasPreviousPage || isFetching}
          >
            Anterior
          </Button>
          <span className="min-w-[92px] text-center text-sm font-semibold text-[#1C262E]">
            Pagina {page} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage(current => current + 1)}
            disabled={!hasNextPage || isFetching}
          >
            Proxima
          </Button>
        </div>
      </footer>
    </section>
  );
};

export default QuestionList;
