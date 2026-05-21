import { useState } from "react";

import { useLogs } from "../hooks/useLogs";

function formatNavigationFlow(flow: string[]) {
  if (flow.length === 0) {
    return "-";
  }

  return flow.join(" -> ");
}

export default function LogTable() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [flag, setFlag] = useState<"ATENDEU" | "NAO_ATENDEU" | undefined>();
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();

  const { logs, meta, isLoading, isError, refetch } = useLogs({
    page,
    limit,
    flag,
    from,
    to,
  });

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const clearFilters = () => {
    setFlag(undefined);
    setFrom(undefined);
    setTo(undefined);
    setPage(1);
  };

  if (isLoading) {
    return <div>Carregando logs...</div>;
  }

  if (isError) {
    return <div>Erro ao carregar logs. Tente novamente.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-sm">Satisfacao</label>
          <select
            value={flag ?? ""}
            onChange={event => {
              const nextFlag = event.target.value as "ATENDEU" | "NAO_ATENDEU" | "";
              setPage(1);
              setFlag(nextFlag || undefined);
            }}
            className="rounded border px-2 py-1"
          >
            <option value="">Todos</option>
            <option value="ATENDEU">Atendeu</option>
            <option value="NAO_ATENDEU">Nao atendeu</option>
          </select>
        </div>

        <div>
          <label className="block text-sm">De</label>
          <input
            type="date"
            value={from ?? ""}
            onChange={event => {
              setPage(1);
              setFrom(event.target.value || undefined);
            }}
            className="rounded border px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-sm">Ate</label>
          <input
            type="date"
            value={to ?? ""}
            onChange={event => {
              setPage(1);
              setTo(event.target.value || undefined);
            }}
            className="rounded border px-2 py-1"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="rounded border px-3 py-1"
          >
            Atualizar
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded border px-3 py-1"
          >
            Limpar
          </button>
        </div>
      </div>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="text-left">
            <th className="border-b py-2">Sessao</th>
            <th className="border-b py-2">Caminho</th>
            <th className="border-b py-2">Satisfacao</th>
            <th className="border-b py-2">Registrado em</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center">
                Nenhum log encontrado
              </td>
            </tr>
          ) : (
            logs.map(log => (
              <tr key={log.id} className="odd:bg-white even:bg-slate-50">
                <td className="py-2">{log.id}</td>
                <td className="py-2" title={formatNavigationFlow(log.navigation_flow)}>
                  {formatNavigationFlow(log.navigation_flow)}
                </td>
                <td className="py-2">
                  {log.flag === "ATENDEU" ? (
                    <span className="font-medium text-green-600">Atendeu</span>
                  ) : (
                    <span className="font-medium text-red-600">Nao atendeu</span>
                  )}
                </td>
                <td className="py-2">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => setPage(current => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="mr-2 rounded border px-3 py-1 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage(current => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Proxima
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span>
            Pagina {meta.page} de {totalPages}
          </span>
          <select
            value={limit}
            onChange={event => {
              setPage(1);
              setLimit(Number(event.target.value));
            }}
            className="rounded border px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
}
