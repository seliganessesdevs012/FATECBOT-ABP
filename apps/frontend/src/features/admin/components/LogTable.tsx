import React, { useState } from 'react';
import { useLogs } from '../hooks/useLogs';
import type { InteractionLogDTO } from '../types/logs.types';

function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) return '-';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function shortSessionId(id: number) {
  return id.toString().slice(-6);
}

export const LogTable: React.FC = () => {
  const {
    data,
    meta,
    isLoading,
    isError,
    page,
    setPage,
    limit,
    setLimit,
    filters,
    setFilters,
    refetch,
  } = useLogs();

  const [flag, setFlag] = useState<'ATENDEU' | 'NAO_ATENDEU' | undefined>(
    (filters.flag as 'ATENDEU' | 'NAO_ATENDEU' | undefined) ?? undefined
  );
  const [from, setFrom] = useState<string | undefined>(filters.from);
  const [to, setTo] = useState<string | undefined>(filters.to);

  const applyFilters = () => {
    setFilters({ flag, from, to });
  };

  const clearFilters = () => {
    setFlag(undefined);
    setFrom(undefined);
    setTo(undefined);
    setFilters({});
  };

  if (isLoading) return <div>Carregando logs...</div>;
  if (isError) return <div>Erro ao carregar logs. Tente novamente.</div>;

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / (meta.limit || limit))) : 1;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm">Satisfação</label>
          <select
            value={flag ?? ''}
            onChange={(e) => setFlag((e.target.value as 'ATENDEU' | 'NAO_ATENDEU') || undefined)}
            className="border rounded px-2 py-1"
          >
            <option value="">Todos</option>
            <option value="ATENDEU">Atendeu</option>
            <option value="NAO_ATENDEU">Não atendeu</option>
          </select>
        </div>

        <div>
          <label className="block text-sm">De</label>
          <input
            type="date"
            value={from ?? ''}
            onChange={(e) => setFrom(e.target.value || undefined)}
            className="border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-sm">Até</label>
          <input
            type="date"
            value={to ?? ''}
            onChange={(e) => setTo(e.target.value || undefined)}
            className="border rounded px-2 py-1"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={applyFilters} className="bg-blue-600 text-white px-3 py-1 rounded">
            Aplicar
          </button>
          <button onClick={clearFilters} className="border px-3 py-1 rounded">
            Limpar
          </button>
          <button onClick={() => refetch()} className="border px-3 py-1 rounded">
            Atualizar
          </button>
        </div>
      </div>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="text-left">
            <th className="border-b py-2">Sessão</th>
            <th className="border-b py-2">Caminho</th>
            <th className="border-b py-2">Satisfação</th>
            <th className="border-b py-2">Duração</th>
            <th className="border-b py-2">Perguntas vinculadas</th>
            <th className="border-b py-2">Registrado em</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 text-center">Nenhum log encontrado</td>
            </tr>
          ) : (
            data.map((row: InteractionLogDTO) => (
              <tr key={row.id} className="odd:bg-white even:bg-slate-50">
                <td className="py-2">{shortSessionId(row.id)}</td>
                <td className="py-2" title={row.navigation_flow.join(' → ')}>
                  {row.navigation_flow.slice(0, 3).join(' → ') || '-'}
                  {row.navigation_flow.length > 3 ? ' …' : ''}
                </td>
                <td className="py-2">
                  {row.flag === 'ATENDEU' ? (
                    <span className="text-green-600 font-medium">Atendeu</span>
                  ) : (
                    <span className="text-red-600 font-medium">Não atendeu</span>
                  )}
                </td>
                <td className="py-2">{formatDuration(row.duration_seconds)}</td>
                <td className="py-2">
                  {(row.linked_questions ?? []).map((q) => (
                    <span key={q.id} className="inline-block bg-slate-100 text-sm px-2 py-0.5 mr-1 rounded">
                      {q.title ?? `#${q.id}`}
                    </span>
                  ))}
                </td>
                <td className="py-2">{row.recorded_at ? new Date(row.recorded_at).toLocaleString() : '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between mt-4">
        <div>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="border px-3 py-1 rounded mr-2 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="border px-3 py-1 rounded disabled:opacity-50"
          >
            Próxima
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span> Página {meta?.page ?? page} de {totalPages} </span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default LogTable;