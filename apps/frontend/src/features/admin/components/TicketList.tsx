import { useMemo, useState } from "react";
import {
  CheckCheck,
  ExternalLink,
  Filter,
  Mail,
  MessageSquareText,
  Paperclip,
  Search,
  Ticket,
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
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-feedback";
import { cn } from "@/lib/utils";
import type { InquiryStatus, Role } from "@/types/common.types";
import { formatDateTime } from "@/utils/date.utils";
import { formatFileSize, openBlobInNewTab } from "@/utils/file.utils";

import { ticketsApi } from "../api/tickets.api";
import { useTickets } from "../hooks/useTickets";
import { useUpdateTicket } from "../hooks/useUpdateTicket";

const PAGE_SIZE = 20;

type StatusFilter = InquiryStatus | "TODOS";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ABERTA", label: "Abertos" },
  { value: "RESPONDIDA", label: "Respondidos" },
];

const getTicketStatusLabel = (status: InquiryStatus): string =>
  status === "ABERTA" ? "Aberto" : "Respondido";

const getTicketStatusClasses = (status: InquiryStatus): string =>
  status === "ABERTA"
    ? "bg-[#FFF1D9] text-[#8B5E13]"
    : "bg-[#E8F3EA] text-[#2E6A4F]";

const getRoleLabel = (role: Role): string =>
  role === "ADMIN" ? "Administrador" : "Secretaria";

const getTicketResponderSummary = (ticket: {
  status: InquiryStatus;
  answered_at?: string | null;
  answered_by_user?: { name: string; role: Role } | null;
}): string => {
  if (ticket.status === "ABERTA") {
    return "Aguardando resposta da equipe.";
  }

  if (ticket.answered_by_user && ticket.answered_at) {
    return `Respondido por ${ticket.answered_by_user.name} (${getRoleLabel(ticket.answered_by_user.role)}) em ${formatDateTime(ticket.answered_at)}.`;
  }

  return "Respondido antes da auditoria de responsavel estar disponivel.";
};

export interface TicketListProps {
  className?: string;
}

export default function TicketList({ className }: TicketListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [activeAttachmentId, setActiveAttachmentId] = useState<number | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [attachmentErrorMessage, setAttachmentErrorMessage] = useState<
    string | null
  >(null);

  const apiStatusFilter = statusFilter === "TODOS" ? undefined : statusFilter;
  const { items, meta, isLoading, isFetching, isError, error, refetch } =
    useTickets({
      status: apiStatusFilter,
      page,
      limit: PAGE_SIZE,
    });
  const updateTicketMutation = useUpdateTicket();

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = useMemo(
    () =>
      items.filter(ticket => {
        if (normalizedSearch.length === 0) {
          return true;
        }

        return (
          ticket.requester_name.toLowerCase().includes(normalizedSearch) ||
          ticket.requester_email.toLowerCase().includes(normalizedSearch) ||
          ticket.question.toLowerCase().includes(normalizedSearch)
        );
      }),
    [items, normalizedSearch],
  );

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  const openTickets = items.filter(ticket => ticket.status === "ABERTA").length;
  const answeredTickets = items.filter(
    ticket => ticket.status === "RESPONDIDA",
  ).length;
  const isUpdating = updateTicketMutation.isPending;
  const updateErrorMessage = updateTicketMutation.isError
    ? getApiErrorMessage(
        updateTicketMutation.error,
        "Nao foi possivel atualizar o ticket.",
      )
    : null;

  const resultsLabel = useMemo(() => {
    if (meta.total === 0) {
      return "Nenhum ticket encontrado.";
    }

    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);

    return `Exibindo ${start}-${end} de ${meta.total} ticket(s).`;
  }, [meta.limit, meta.page, meta.total]);

  const handleFilterChange = (nextFilter: StatusFilter) => {
    setStatusFilter(nextFilter);
    setPage(1);
  };

  const handleMarkAsAnswered = async (ticketId: number) => {
    setActiveTicketId(ticketId);
    setSuccessMessage(null);

    try {
      const updatedTicket = await updateTicketMutation.mutateAsync({
        id: ticketId,
        status: "RESPONDIDA",
      });

      const responderName =
        updatedTicket.answered_by_user?.name ?? "usuario autenticado";

      setSuccessMessage(
        `Ticket marcado como respondido com sucesso por ${responderName}.`,
      );
    } finally {
      setActiveTicketId(null);
    }
  };

  const handleOpenAttachment = async (ticketId: number) => {
    setActiveAttachmentId(ticketId);
    setAttachmentErrorMessage(null);

    try {
      const fileBlob = await ticketsApi.downloadAttachment(ticketId);
      openBlobInNewTab(fileBlob);
    } catch (downloadError) {
      setAttachmentErrorMessage(
        getApiErrorMessage(
          downloadError,
          "Nao foi possivel abrir o anexo deste ticket.",
        ),
      );
    } finally {
      setActiveAttachmentId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando tickets..." />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Erro ao carregar tickets"
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
        icon={Ticket}
        badge="Atendimento interno"
        title="Tickets recebidos pelo chatbot"
        description="Acompanhe as perguntas encaminhadas para a equipe interna, abra os anexos recebidos e marque como respondidas aquelas já tratadas fora da plataforma."
        aside={
          <>
            <PanelStatCard label="Pendentes na página" value={openTickets} />
            <PanelStatCard label="Respondidos na página" value={answeredTickets} />
          </>
        }
      />

      <PanelSectionCard>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_auto] lg:items-end">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A7C6A]" />
            <Input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome, e-mail ou conteúdo do ticket"
              className="border-[#DDD1C0] bg-white pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
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
                  <Filter className="size-3.5" aria-hidden="true" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      </PanelSectionCard>

      {successMessage ? (
        <ErrorAlert
          variant="info"
          title="Ticket atualizado"
          message={successMessage}
          dismissible
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

      {updateErrorMessage ? (
        <ErrorAlert
          title="Erro ao atualizar ticket"
          message={updateErrorMessage}
          dismissible
          onDismiss={() => updateTicketMutation.reset()}
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

      {filteredItems.length === 0 ? (
        <PanelEmptyState
          title="Nenhum ticket para este recorte."
          description="Ajuste a busca ou o filtro de status para revisar outro conjunto."
        />
      ) : (
        <PanelTableCard>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--brand-secondary-soft)] text-xs uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Solicitante</th>
                  <th className="px-5 py-4 font-semibold">Ticket</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Criado em</th>
                  <th className="px-5 py-4 font-semibold">Responsável</th>
                  <th className="px-5 py-4 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(ticket => {
                  const isOpen = ticket.status === "ABERTA";
                  const isRowBusy = isUpdating && activeTicketId === ticket.id;
                  const isAttachmentBusy = activeAttachmentId === ticket.id;

                  return (
                    <tr
                      key={ticket.id}
                      className={cn(
                        "border-t border-[#EFE5D9] align-top transition-colors",
                        isOpen ? "bg-[#FFF9ED]" : "bg-white",
                      )}
                    >
                      <td className="px-5 py-5">
                        <div className="space-y-2">
                          <p className="font-semibold text-[#1C262E]">
                            {ticket.requester_name}
                          </p>
                          <div className="space-y-1 text-xs text-[#6E6252]">
                            <p className="inline-flex items-center gap-2">
                              <Mail className="size-3.5" aria-hidden="true" />
                              {ticket.requester_email}
                            </p>
                            <p>
                              {ticket.session_log_id
                                ? `Sessao vinculada: #${ticket.session_log_id}`
                                : "Sem sessao vinculada"}
                            </p>
                            {ticket.has_attachment && ticket.attachment_name ? (
                              <button
                                type="button"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-full text-left text-xs font-medium text-[var(--brand-secondary)] transition-colors hover:text-[var(--brand-primary)]"
                                onClick={() => void handleOpenAttachment(ticket.id)}
                              >
                                <Paperclip className="size-3.5" aria-hidden="true" />
                                <span>{ticket.attachment_name}</span>
                                {ticket.attachment_size_bytes ? (
                                  <span className="text-[#8C7E6C]">
                                    ({formatFileSize(ticket.attachment_size_bytes)})
                                  </span>
                                ) : null}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <div className="space-y-2">
                          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                            <MessageSquareText
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Conteúdo
                          </p>
                          <p className="max-w-xl leading-relaxed text-[#2B2B2B]">
                            {ticket.question}
                          </p>
                          <p>
                            {ticket.session_log_id
                              ? `Sessão vinculada: #${ticket.session_log_id}`
                              : "Sem sessão vinculada"}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
                            getTicketStatusClasses(ticket.status),
                          )}
                        >
                          {getTicketStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-[#4D4337]">
                        <p>{formatDateTime(ticket.created_at)}</p>
                      </td>
                      <td className="px-5 py-5">
                        <p className="max-w-[250px] text-xs leading-relaxed text-[#6E6252]">
                          {getTicketResponderSummary(ticket)}
                        </p>
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex flex-col items-end gap-2">
                          {ticket.has_attachment ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void handleOpenAttachment(ticket.id)}
                              disabled={isAttachmentBusy}
                            >
                              <ExternalLink className="size-4" aria-hidden="true" />
                              {isAttachmentBusy ? "Abrindo..." : "Abrir anexo"}
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleMarkAsAnswered(ticket.id)}
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
                                : "Marcar como respondido"
                              : "Já respondido"}
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
            Página {page} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage(current => current + 1)}
            disabled={!hasNextPage || isFetching}
          >
            Próxima
          </Button>
        </div>
      </PanelFooterBar>
    </section>
  );
}
