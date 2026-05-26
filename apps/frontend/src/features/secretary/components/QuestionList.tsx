import { useMemo, useState } from "react";
import {
  CheckCheck,
  ExternalLink,
  Filter,
  Mail,
  MessageSquareText,
  Paperclip,
} from "lucide-react";

import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  PanelEmptyState,
  PanelFooterBar,
  PanelPageIntro,
  PanelSectionCard,
  PanelStatCard,
  PanelTableCard,
} from "@/components/shared/panel/PanelScaffold";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-feedback";
import { cn } from "@/lib/utils";
import type { InquiryStatus, Role } from "@/types/common.types";
import { formatDateTime } from "@/utils/date.utils";
import { formatFileSize, openBlobInNewTab } from "@/utils/file.utils";

import { questionsApi } from "../api/questions.api";
import { useQuestions } from "../hooks/useQuestions";
import { useUpdateQuestion } from "../hooks/useUpdateQuestion";
import type { QuestionResponseDTO } from "../types/questions.types";
import QuestionStatusBadge from "./QuestionStatusBadge";

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

const getRoleLabel = (role: Role): string =>
  role === "ADMIN" ? "Administrador" : "Secretaria";

const getQuestionSummary = (question: QuestionResponseDTO): string => {
  if (question.status === "ABERTA") {
    return "Aguardando retorno externo da secretaria.";
  }

  return "Marcada como respondida na fila interna.";
};

const getQuestionResponderSummary = (question: QuestionResponseDTO): string => {
  if (question.status === "ABERTA") {
    return "Aguardando retorno da equipe.";
  }

  if (question.answered_by_user && question.answered_at) {
    return `Respondida por ${question.answered_by_user.name} (${getRoleLabel(question.answered_by_user.role)}) em ${formatDateTime(question.answered_at)}.`;
  }

  return "Respondida antes da auditoria de responsavel estar disponivel.";
};

export interface QuestionListProps {
  className?: string;
}

const QuestionList = ({ className }: QuestionListProps) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODAS");
  const [page, setPage] = useState(1);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [activeAttachmentId, setActiveAttachmentId] = useState<number | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [attachmentErrorMessage, setAttachmentErrorMessage] = useState<
    string | null
  >(null);

  const apiStatusFilter = statusFilter === "TODAS" ? undefined : statusFilter;
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
    ? getApiErrorMessage(
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
    setSuccessMessage(null);

    try {
      const updatedQuestion = await updateQuestionMutation.mutateAsync({
        id: questionId,
        status: "RESPONDIDA",
      });

      const responderName =
        updatedQuestion.answered_by_user?.name ?? "usuario autenticado";

      setSuccessMessage(
        `Pergunta marcada como respondida com sucesso por ${responderName}.`,
      );
    } finally {
      setActiveQuestionId(null);
    }
  };

  const handleOpenAttachment = async (question: QuestionResponseDTO) => {
    setActiveAttachmentId(question.id);
    setAttachmentErrorMessage(null);

    try {
      const fileBlob = await questionsApi.downloadAttachment(question.id);
      openBlobInNewTab(fileBlob);
    } catch (downloadError) {
      setAttachmentErrorMessage(
        getApiErrorMessage(
          downloadError,
          "Nao foi possivel abrir o anexo desta pergunta.",
        ),
      );
    } finally {
      setActiveAttachmentId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando perguntas..." />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Erro ao carregar perguntas"
        message={getApiErrorMessage(error, "Tente novamente em instantes.")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <section className={cn("space-y-5", className)}>
      <PanelPageIntro
        icon={Filter}
        badge="Fila de atendimento"
        title="Perguntas recebidas"
        description="Use o filtro para priorizar a fila, abra os anexos enviados pelo aluno e marque como respondidas as perguntas ja tratadas fora da plataforma."
        aside={
          <>
            <PanelStatCard
              label="Status atual"
              value={
                <span className="text-sm font-semibold text-[#1C262E]">
                  {FILTER_STATUS_COPY[statusFilter]}
                </span>
              }
              supportingText={resultsLabel}
            />
            <PanelStatCard
              label="Operacao"
              value={
                <span className="text-sm font-semibold text-[#1C262E]">
                  Atendimento externo
                </span>
              }
              supportingText="A resposta ao aluno acontece por e-mail fora do sistema."
            />
          </>
        }
      />

      <PanelSectionCard>
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
      </PanelSectionCard>

      {successMessage ? (
        <ErrorAlert
          variant="info"
          title="Pergunta atualizada"
          message={successMessage}
          dismissible
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

      {updateErrorMessage ? (
        <ErrorAlert
          title="Erro ao atualizar pergunta"
          message={updateErrorMessage}
          dismissible
          onDismiss={() => updateQuestionMutation.reset()}
        />
      ) : null}

      {attachmentErrorMessage ? (
        <ErrorAlert
          title="Erro ao abrir anexo"
          message={attachmentErrorMessage}
          dismissible
          onDismiss={() => setAttachmentErrorMessage(null)}
        />
      ) : null}

      {items.length === 0 ? (
        <PanelEmptyState
          title="Nenhuma pergunta para este filtro."
          description="Ajuste o status selecionado para revisar outro recorte da fila."
        />
      ) : (
        <PanelTableCard>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#FBF7F1] text-xs uppercase tracking-[0.12em] text-[#8C7E6C]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Solicitante</th>
                  <th className="px-5 py-4 font-semibold">Pergunta</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Criada em</th>
                  <th className="px-5 py-4 font-semibold">Responsavel</th>
                  <th className="px-5 py-4 text-right font-semibold">Acao</th>
                </tr>
              </thead>
              <tbody>
                {items.map(question => {
                  const isOpen = question.status === "ABERTA";
                  const isRowBusy =
                    isUpdating && activeQuestionId === question.id;
                  const isAttachmentBusy = activeAttachmentId === question.id;

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
                            {question.has_attachment && question.attachment_name ? (
                              <button
                                type="button"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-full text-left text-xs font-medium text-[var(--brand-secondary)] transition-colors hover:text-[var(--brand-primary)]"
                                onClick={() => void handleOpenAttachment(question)}
                              >
                                <Paperclip className="size-3.5" aria-hidden="true" />
                                <span>{question.attachment_name}</span>
                                {question.attachment_size_bytes ? (
                                  <span className="text-[#8C7E6C]">
                                    ({formatFileSize(question.attachment_size_bytes)})
                                  </span>
                                ) : null}
                              </button>
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
                        <p className="max-w-[250px] text-xs leading-relaxed text-[#6E6252]">
                          {getQuestionResponderSummary(question)}
                        </p>
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex flex-col items-end gap-2">
                          {question.has_attachment ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void handleOpenAttachment(question)}
                              disabled={isAttachmentBusy}
                            >
                              <ExternalLink className="size-4" aria-hidden="true" />
                              {isAttachmentBusy ? "Abrindo..." : "Abrir anexo"}
                            </Button>
                          ) : null}
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
        </PanelTableCard>
      )}

      <PanelFooterBar>
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
      </PanelFooterBar>
    </section>
  );
};

export default QuestionList;
