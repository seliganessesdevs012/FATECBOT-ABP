import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import type { NodeListItemDTO } from "@/features/admin/api/nodes.api";
import { useNodes } from "@/features/admin/hooks/useNodes";
import { cn } from "@/lib/utils";

interface TreeNode extends NodeListItemDTO {
  children: TreeNode[];
}

export interface NodeTreeProps {
  className?: string;
  selectedNodeId?: number | null;
  onSelectNode?: (node: NodeListItemDTO) => void;
  onCreateNode?: (parent: NodeListItemDTO | null) => void;
  onEditNode?: (node: NodeListItemDTO) => void;
}

const sortNodes = (left: NodeListItemDTO, right: NodeListItemDTO): number => {
  if (left.display_order !== right.display_order) {
    return left.display_order - right.display_order;
  }

  return left.title.localeCompare(right.title, "pt-BR");
};

const buildNodeTree = (nodes: NodeListItemDTO[]): TreeNode[] => {
  const nodeMap = new Map<number, TreeNode>();

  nodes.forEach(node => {
    nodeMap.set(node.id, {
      ...node,
      children: [],
    });
  });

  const roots: TreeNode[] = [];

  nodes
    .slice()
    .sort(sortNodes)
    .forEach(node => {
      const treeNode = nodeMap.get(node.id);

      if (!treeNode) {
        return;
      }

      if (node.parent_id === null) {
        roots.push(treeNode);
        return;
      }

      const parentNode = nodeMap.get(node.parent_id);

      if (!parentNode) {
        roots.push(treeNode);
        return;
      }

      parentNode.children.push(treeNode);
      parentNode.children.sort(sortNodes);
    });

  return roots.sort(sortNodes);
};

const buildLevels = (tree: TreeNode[]): TreeNode[][] => {
  const levels: TreeNode[][] = [];

  const visit = (nodes: TreeNode[], depth: number) => {
    if (nodes.length === 0) {
      return;
    }

    if (!levels[depth]) {
      levels[depth] = [];
    }

    levels[depth].push(...nodes);

    nodes.forEach(node => {
      if (node.children.length > 0) {
        visit(node.children, depth + 1);
      }
    });
  };

  visit(tree, 0);

  return levels.map(level => level.slice().sort(sortNodes));
};

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

const NodeTree = ({
  className,
  selectedNodeId,
  onSelectNode,
  onCreateNode,
  onEditNode,
}: NodeTreeProps) => {
  const { nodes, isLoading, isError, error, refetch, deleteNode } = useNodes();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const tree = useMemo(() => buildNodeTree(nodes), [nodes]);
  const levels = useMemo(() => buildLevels(tree), [tree]);
  const selectedNode =
    nodes.find(node => node.id === selectedNodeId) ?? null;

  const totalRoots = tree.length;
  const activeNodes = nodes.filter(node => node.is_active).length;

  const handleDeleteNode = async (node: NodeListItemDTO): Promise<void> => {
    if (node.childrenCount > 0 || deletingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Remover o no "${node.title}"? Esta acao nao pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setDeletingId(node.id);

    try {
      await deleteNode(node.id);
    } catch (deleteError) {
      setActionError(
        getErrorMessage(deleteError, "Nao foi possivel remover o no."),
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando arvore de navegacao..." />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Erro ao carregar a arvore"
        message={getErrorMessage(error, "Tente novamente em instantes.")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const isDeleteDisabled =
    !selectedNode || selectedNode.childrenCount > 0 || deletingId !== null;
  const primaryActionLabel = selectedNode
    ? selectedNode.childrenCount > 0 || selectedNode.parent_id === null
      ? "Adicionar opcao"
      : "Adicionar resposta"
    : "Novo no raiz";

  return (
    <section className={cn("space-y-6", className)}>
      <header className="space-y-4">
        <div className="flex justify-end">
          {onCreateNode ? (
            <button
              type="button"
              onClick={() => onCreateNode(null)}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#D8CFBF] bg-white px-4 py-2 text-sm font-semibold text-[#7D120D] transition-colors hover:bg-[#FBF5EB]"
            >
              <Plus className="size-4" aria-hidden="true" />
              Novo no raiz
            </button>
          ) : null}
        </div>

        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 shadow-[0_10px_24px_rgba(76,56,24,0.06)]">
            <img
              src="/care.svg"
              alt="Caré"
              className="h-8 w-8 rounded-full object-contain"
            />
            <h2 className="text-3xl font-black text-[#1C1C1C]">Caré</h2>
          </div>

          <div>
            <p className="text-xl font-black italic text-[#1C1C1C]">
              {selectedNode?.title ?? "O que voce deseja?"}
            </p>
            <p className="mt-2 text-sm text-[#6F675D]">
              {nodes.length} nos cadastrados, {totalRoots} raizes e {activeNodes} ativos.
            </p>
            {selectedNode ? (
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[#8D7E6D]">
                /{selectedNode.slug}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {actionError ? (
        <ErrorAlert
          title="Erro ao remover no"
          message={actionError}
          dismissible
          onDismiss={() => setActionError(null)}
        />
      ) : null}

      {levels.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-[#D8CFBF] bg-white/60 px-6 py-12 text-center">
          <p className="text-base font-semibold text-[#1C1C1C]">
            Nenhum no foi cadastrado ate o momento.
          </p>
          <p className="mt-2 text-sm text-[#6F675D]">
            Crie o primeiro item para montar a arvore de atendimento do Caré.
          </p>
          {onCreateNode ? (
            <button
              type="button"
              onClick={() => onCreateNode(null)}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#7D120D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5F0D09]"
            >
              <Plus className="size-4" aria-hidden="true" />
              Criar primeiro no
            </button>
          ) : null}
        </div>
      ) : null}

      {levels.length > 0 ? (
        <div className="space-y-6 rounded-[32px] border border-[#E6DDCD] bg-[#EEE8DB]/85 px-4 py-6 shadow-[0_22px_45px_rgba(76,56,24,0.05)] lg:px-6">
          {levels.map((levelNodes, index) => (
            <div
              key={`level-${index + 1}`}
              className="grid gap-3 lg:grid-cols-[90px_minmax(0,1fr)] lg:items-start"
            >
              <p className="pt-5 text-sm font-medium italic text-[#2B2B2B]">
                Nivel {index + 1}
              </p>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {levelNodes.map(node => {
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onSelectNode?.(node)}
                      className={cn(
                        "min-h-[78px] rounded-[20px] border px-4 py-4 text-left shadow-[0_14px_30px_rgba(76,56,24,0.04)] transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D120D]/35",
                        isSelected
                          ? "border-[#E5D9CB] bg-white text-[#1C1C1C]"
                          : "border-transparent bg-[#D7D7D7]/80 text-[#2E2E2E] hover:bg-[#CECECE]",
                        !node.is_active && "opacity-60",
                      )}
                      aria-pressed={isSelected}
                    >
                      <span className="block text-[0.96rem] font-semibold italic leading-tight">
                        {node.title}
                      </span>
                      <span className="mt-3 block text-[0.68rem] uppercase tracking-[0.16em] text-[#786E62]">
                        {node.childrenCount > 0
                          ? `${node.childrenCount} opcoes`
                          : "Resposta final"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-3 border-t border-[#DFD3C1] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                title={
                  selectedNode?.childrenCount
                    ? "Remova os filhos antes de excluir este no."
                    : undefined
                }
                disabled={isDeleteDisabled}
                onClick={() => {
                  if (selectedNode) {
                    void handleDeleteNode(selectedNode);
                  }
                }}
              >
                <Trash2 aria-hidden="true" />
                {deletingId === selectedNode?.id ? "Removendo..." : "Deletar"}
              </Button>

              {selectedNode ? (
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#7F776D]">
                  Selecionado: {selectedNode.title}
                </span>
              ) : (
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#7F776D]">
                  Selecione um no para editar ou expandir o fluxo
                </span>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              {onCreateNode ? (
                <button
                  type="button"
                  onClick={() => onCreateNode(selectedNode)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#7D120D] shadow-[0_12px_24px_rgba(76,56,24,0.05)] transition-colors hover:bg-[#FBF5EB]"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {primaryActionLabel}
                </button>
              ) : null}

              {onEditNode ? (
                <button
                  type="button"
                  disabled={!selectedNode}
                  onClick={() => {
                    if (selectedNode) {
                      onEditNode(selectedNode);
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#7D120D] shadow-[0_12px_24px_rgba(76,56,24,0.05)] transition-colors",
                    selectedNode
                      ? "hover:bg-[#FBF5EB]"
                      : "cursor-not-allowed opacity-45",
                  )}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default NodeTree;
