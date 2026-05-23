import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { CheckCheck, Filter, Mail, MessageSquareText, Search, Ticket } from "lucide-react";

import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { InquiryStatus } from "@/types/common.types";
import { formatDateTime } from "@/utils/date.utils";

import { useTickets } from "../hooks/useTickets";
import { useUpdateTicket } from "../hooks/useUpdateTicket";

const PAGE_SIZE = 20;

type StatusFilter = InquiryStatus | "TODOS";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ABERTA", label: "Abertos" },
  { value: "RESPONDIDA", label: "Respondidos" },
];

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

const getTicketStatusLabel = (status: InquiryStatus): string =>
  status === "ABERTA" ? "Aberto" : "Respondido";

const getTicketStatusClasses = (status: InquiryStatus): string =>
  status === "ABERTA"
    ? "bg-[#FFF1D9] text-[#8B5E13]"
    : "bg-[#E8F3EA] text-[#2E6A4F]";

export interface TicketListProps {
  className?: string;
}

export default function TicketList({ className }: TicketListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);

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
    ? getErrorMessage(
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

    try {
      await updateTicketMutation.mutateAsync({
        id: ticketId,
        status: "RESPONDIDA",
      });
    } finally {
      setActiveTicketId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando tickets..." />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Erro ao carregar tickets"
        message={getErrorMessage(error, "Tente novamente em instantes.")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <section className={cn("space-y-5", className)}>
      <header className="space-y-4 rounded-[28px] border border-[#E3D8CA] bg-white p-5 shadow-[0_18px_40px_rgba(92,53,12,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F6EFE4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A6548]">
              <Ticket className="size-3.5" aria-hidden="true" />
              Atendimento interno
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1C262E]">
                Tickets recebidos pelo chatbot
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6E6252]">
                Acompanhe as perguntas encaminhadas para a equipe interna e
                marque como respondidas aquelas ja tratadas fora da plataforma.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-[#FCF8F2] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                Pendentes na pagina
              </p>
              <p className="mt-2 text-2xl font-black text-[#1C262E]">
                {openTickets}
              </p>
            </div>
            <div className="rounded-[22px] bg-[#FCF8F2] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                Respondidos na pagina
              </p>
              <p className="mt-2 text-2xl font-black text-[#1C262E]">
                {answeredTickets}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_auto] lg:items-end">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A7C6A]" />
            <Input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome, email ou conteudo do ticket"
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
      </header>

      {updateErrorMessage ? (
        <ErrorAlert
          title="Erro ao atualizar ticket"
          message={updateErrorMessage}
          dismissible
          onDismiss={() => updateTicketMutation.reset()}
        />
      ) : null}

      {filteredItems.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#D8C9B3] bg-[#FFFDF9] px-6 py-12 text-center shadow-[0_18px_40px_rgba(92,53,12,0.04)]">
          <p className="text-lg font-semibold text-[#1C262E]">
            Nenhum ticket para este recorte.
          </p>
          <p className="mt-2 text-sm text-[#6E6252]">
            Ajuste a busca ou o filtro de status para revisar outro conjunto.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-[#E3D8CA] bg-white shadow-[0_18px_40px_rgba(92,53,12,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--brand-secondary-soft)] text-xs uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Solicitante</th>
                  <th className="px-5 py-4 font-semibold">Ticket</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Criado em</th>
                  <th className="px-5 py-4 text-right font-semibold">Acao</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(ticket => {
                  const isOpen = ticket.status === "ABERTA";
                  const isRowBusy = isUpdating && activeTicketId === ticket.id;

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
                            Conteudo
                          </p>
                          <p className="max-w-xl leading-relaxed text-[#2B2B2B]">
                            {ticket.question}
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
                        <div className="flex justify-end">
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
                                : "Marcar respondido"
                              : "Ja respondido"}
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
}
