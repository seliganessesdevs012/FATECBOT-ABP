import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  CalendarRange,
  CircleCheck,
  CircleX,
  Filter,
  MessageSquareText,
  Route,
} from "lucide-react";

import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/date.utils";

import { useLogs } from "../hooks/useLogs";

const PAGE_SIZE = 20;

type SatisfactionFilter = "TODOS" | "ATENDEU" | "NAO_ATENDEU";

const FILTER_OPTIONS: { value: SatisfactionFilter; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ATENDEU", label: "Atendeu" },
  { value: "NAO_ATENDEU", label: "Nao atendeu" },
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

const formatNavigationFlow = (flow: string[]) => {
  if (flow.length === 0) {
    return "Sem caminho registrado";
  }

  return flow.join(" / ");
};

const getSatisfactionLabel = (flag: "ATENDEU" | "NAO_ATENDEU") =>
  flag === "ATENDEU" ? "Atendeu" : "Nao atendeu";

const getSatisfactionClasses = (flag: "ATENDEU" | "NAO_ATENDEU") =>
  flag === "ATENDEU"
    ? "bg-[#E8F3EA] text-[#2E6A4F]"
    : "bg-[#FBE7E1] text-[#A13D1C]";

export interface LogTableProps {
  className?: string;
}

export default function LogTable({ className }: LogTableProps) {
  const [page, setPage] = useState(1);
  const [flagFilter, setFlagFilter] = useState<SatisfactionFilter>("TODOS");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const apiFlagFilter = flagFilter === "TODOS" ? undefined : flagFilter;
  const { logs, meta, isLoading, isError, error, refetch } = useLogs({
    page,
    limit: PAGE_SIZE,
    flag: apiFlagFilter,
    from: from || undefined,
    to: to || undefined,
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredLogs = useMemo(
    () =>
      logs.filter(log => {
        if (normalizedSearch.length === 0) {
          return true;
        }

        const flowText = log.navigation_flow.join(" ").toLowerCase();
        const questionText = log.questions
          .map(question => question.question)
          .join(" ")
          .toLowerCase();

        return (
          flowText.includes(normalizedSearch) ||
          questionText.includes(normalizedSearch) ||
          String(log.id).includes(normalizedSearch)
        );
      }),
    [logs, normalizedSearch],
  );

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  const positiveCount = logs.filter(log => log.flag === "ATENDEU").length;
  const negativeCount = logs.filter(log => log.flag === "NAO_ATENDEU").length;

  const resultsLabel = useMemo(() => {
    if (meta.total === 0) {
      return "Nenhum atendimento encontrado.";
    }

    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);

    return `Exibindo ${start}-${end} de ${meta.total} atendimento(s).`;
  }, [meta.limit, meta.page, meta.total]);

  const clearFilters = () => {
    setFlagFilter("TODOS");
    setFrom("");
    setTo("");
    setSearchTerm("");
    setPage(1);
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando historico de atendimentos..." />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Erro ao carregar historico"
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
              <Route className="size-3.5" aria-hidden="true" />
              Historico de atendimentos
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1C262E]">
                Sessoes registradas pelo chatbot
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6E6252]">
                Analise o caminho percorrido no chatbot, a satisfacao registrada
                e as perguntas vinculadas a cada atendimento.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-[#FCF8F2] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                Atendeu nesta pagina
              </p>
              <p className="mt-2 text-2xl font-black text-[#1C262E]">
                {positiveCount}
              </p>
            </div>
            <div className="rounded-[22px] bg-[#FCF8F2] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                Nao atendeu nesta pagina
              </p>
              <p className="mt-2 text-2xl font-black text-[#1C262E]">
                {negativeCount}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_180px_180px_auto] lg:items-end">
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Buscar por sessao, caminho ou pergunta vinculada"
            className="border-[#DDD1C0] bg-white"
          />

          <Input
            type="date"
            value={from}
            onChange={event => {
              setPage(1);
              setFrom(event.target.value);
            }}
            className="border-[#DDD1C0] bg-white"
          />

          <Input
            type="date"
            value={to}
            onChange={event => {
              setPage(1);
              setTo(event.target.value);
            }}
            className="border-[#DDD1C0] bg-white"
          />

          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map(option => {
              const isActive = option.value === flagFilter;

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
                  onClick={() => {
                    setFlagFilter(option.value);
                    setPage(1);
                  }}
                >
                  <Filter className="size-3.5" aria-hidden="true" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      </header>

      {filteredLogs.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#D8C9B3] bg-[#FFFDF9] px-6 py-12 text-center shadow-[0_18px_40px_rgba(92,53,12,0.04)]">
          <p className="text-lg font-semibold text-[#1C262E]">
            Nenhum atendimento para este recorte.
          </p>
          <p className="mt-2 text-sm text-[#6E6252]">
            Ajuste busca, datas ou satisfacao para revisar outro conjunto.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-[#E3D8CA] bg-white shadow-[0_18px_40px_rgba(92,53,12,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--brand-secondary-soft)] text-xs uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Sessao</th>
                  <th className="px-5 py-4 font-semibold">Caminho</th>
                  <th className="px-5 py-4 font-semibold">Satisfacao</th>
                  <th className="px-5 py-4 font-semibold">Perguntas vinculadas</th>
                  <th className="px-5 py-4 font-semibold">Registrado em</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr
                    key={log.id}
                    className="border-t border-[#EFE5D9] align-top transition-colors hover:bg-[#FFF9F0]"
                  >
                    <td className="px-5 py-5">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#1C262E]">
                          Sessao #{log.id}
                        </p>
                        <p className="text-xs text-[#6E6252]">
                          {log.navigation_flow.length} etapa(s) registradas
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="space-y-2">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                          <Route className="size-3.5" aria-hidden="true" />
                          Fluxo percorrido
                        </p>
                        <p className="max-w-xl leading-relaxed text-[#2B2B2B]">
                          {formatNavigationFlow(log.navigation_flow)}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
                          getSatisfactionClasses(log.flag),
                        )}
                      >
                        {log.flag === "ATENDEU" ? (
                          <CircleCheck className="mr-1 size-3.5" aria-hidden="true" />
                        ) : (
                          <CircleX className="mr-1 size-3.5" aria-hidden="true" />
                        )}
                        {getSatisfactionLabel(log.flag)}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      {log.questions.length === 0 ? (
                        <p className="text-sm text-[#6E6252]">
                          Nenhuma pergunta vinculada.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {log.questions.map(question => (
                            <div
                              key={question.id}
                              className="rounded-2xl bg-[#FCF8F2] px-3 py-2"
                            >
                              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                                <MessageSquareText
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                                Pergunta #{question.id}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-[#2B2B2B]">
                                {question.question}
                              </p>
                              <p className="mt-1 text-xs text-[#6E6252]">
                                {question.status === "ABERTA"
                                  ? "Status: Aberta"
                                  : "Status: Respondida"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-5 text-[#4D4337]">
                      <p className="inline-flex items-center gap-2">
                        <CalendarRange className="size-3.5" aria-hidden="true" />
                        {formatDateTime(log.created_at)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer className="flex flex-col gap-3 rounded-[24px] border border-[#E3D8CA] bg-[#F8F3EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6E6252]">{resultsLabel}</div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={
              flagFilter === "TODOS" &&
              from.length === 0 &&
              to.length === 0 &&
              searchTerm.length === 0
            }
          >
            Limpar filtros
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage(current => Math.max(1, current - 1))}
            disabled={!hasPreviousPage}
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
            disabled={!hasNextPage}
          >
            Proxima
          </Button>
        </div>
      </footer>
    </section>
  );
}
