import { useMemo, useState, type ReactElement } from "react";
import { isAxiosError } from "axios";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderTree,
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

interface RenderNodeParams {
  node: TreeNode;
  depth: number;
  deletingId: number | null;
  expandedNodeIds: Set<number>;
  selectedNodeId?: number | null;
  onToggleNode: (nodeId: number) => void;
  onDeleteNode: (node: NodeListItemDTO) => Promise<void>;
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

const renderNode = ({
  node,
  depth,
  deletingId,
  expandedNodeIds,
  selectedNodeId,
  onToggleNode,
  onDeleteNode,
  onSelectNode,
  onCreateNode,
  onEditNode,
}: RenderNodeParams): ReactElement => {
  const hasChildren = node.children.length > 0;
  const isExpanded = hasChildren ? expandedNodeIds.has(node.id) : false;
  const isDeleting = deletingId === node.id;
  const isSelected = selectedNodeId === node.id;
  const isDeleteBlocked = node.childrenCount > 0 || deletingId !== null;
  const deleteHint =
    node.childrenCount > 0
      ? "Remova os filhos antes de excluir este no."
      : undefined;

  return (
    <li key={node.id} className="space-y-3">
      <div
        className={cn(
          "rounded-xl border border-border/70 bg-background px-4 py-4 shadow-sm transition-colors",
          isSelected && "border-primary/40 bg-primary/5",
        )}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              {hasChildren ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    isExpanded
                      ? `Recolher ${node.title}`
                      : `Expandir ${node.title}`
                  }
                  aria-expanded={isExpanded}
                  onClick={() => onToggleNode(node.id)}
                >
                  {isExpanded ? (
                    <ChevronDown aria-hidden="true" />
                  ) : (
                    <ChevronRight aria-hidden="true" />
                  )}
                </Button>
              ) : (
                <span
                  aria-hidden="true"
                  className="inline-flex size-7 shrink-0"
                />
              )}

              <button
                type="button"
                className="min-w-0 text-left"
                onClick={() => onSelectNode?.(node)}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {hasChildren ? (
                    <FolderTree className="size-4 text-primary" />
                  ) : (
                    <FileText className="size-4 text-muted-foreground" />
                  )}
                  <span className="truncate">{node.title}</span>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  /{node.slug}
                </p>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 pl-9 text-xs">
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                Ordem {node.display_order}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                {node.childrenCount} {node.childrenCount === 1 ? "filho" : "filhos"}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 font-medium",
                  node.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {node.is_active ? "Ativo" : "Inativo"}
              </span>
              {node.parent_id === null ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                  Raiz
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onCreateNode ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCreateNode(node)}
              >
                <Plus aria-hidden="true" />
                Adicionar filho
              </Button>
            ) : null}

            {onEditNode ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditNode(node)}
              >
                <Pencil aria-hidden="true" />
                Editar
              </Button>
            ) : null}

            <Button
              type="button"
              variant="destructive"
              size="sm"
              title={deleteHint}
              disabled={isDeleteBlocked}
              onClick={() => onDeleteNode(node)}
            >
              <Trash2 aria-hidden="true" />
              {isDeleting ? "Removendo..." : "Remover"}
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded ? (
        <ul
          className="space-y-3 border-l border-border/70 pl-4"
          style={{ marginLeft: `${Math.max(depth, 0)}rem` }}
        >
          {node.children.map(child =>
            renderNode({
              node: child,
              depth: depth + 1,
              deletingId,
              expandedNodeIds,
              selectedNodeId,
              onToggleNode,
              onDeleteNode,
              onSelectNode,
              onCreateNode,
              onEditNode,
            }),
          )}
        </ul>
      ) : null}
    </li>
  );
};

const NodeTree = ({
  className,
  selectedNodeId,
  onSelectNode,
  onCreateNode,
  onEditNode,
}: NodeTreeProps) => {
  const { nodes, isLoading, isError, error, refetch, deleteNode } = useNodes();
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<number>>(
    () => new Set<number>(),
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const tree = useMemo(() => buildNodeTree(nodes), [nodes]);
  const branchNodeIds = useMemo(
    () => new Set(nodes.filter(node => node.childrenCount > 0).map(node => node.id)),
    [nodes],
  );
  const expandedNodeIds = useMemo(() => {
    const next = new Set<number>();

    branchNodeIds.forEach(nodeId => {
      if (!collapsedNodeIds.has(nodeId)) {
        next.add(nodeId);
      }
    });

    return next;
  }, [branchNodeIds, collapsedNodeIds]);

  const totalRoots = tree.length;
  const activeNodes = nodes.filter(node => node.is_active).length;

  const handleToggleNode = (nodeId: number) => {
    setCollapsedNodeIds(current => {
      const next = new Set(current);

      if (!branchNodeIds.has(nodeId)) {
        return next;
      }

      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }

      return next;
    });
  };

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

  return (
    <section className={cn("space-y-4", className)}>
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Arvore de navegacao
          </h2>
          <p className="text-sm text-muted-foreground">
            {nodes.length} nos cadastrados, {totalRoots} raizes e {activeNodes} ativos.
          </p>
        </div>

        {onCreateNode ? (
          <Button type="button" onClick={() => onCreateNode(null)}>
            <Plus aria-hidden="true" />
            Novo no raiz
          </Button>
        ) : null}
      </header>

      {actionError ? (
        <ErrorAlert
          title="Erro ao remover no"
          message={actionError}
          dismissible
          onDismiss={() => setActionError(null)}
        />
      ) : null}

      {tree.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Nenhum no foi cadastrado ate o momento.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Quando existirem nos, a hierarquia completa aparecera aqui.
          </p>

          {onCreateNode ? (
            <div className="mt-4">
              <Button type="button" onClick={() => onCreateNode(null)}>
                <Plus aria-hidden="true" />
                Criar primeiro no
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <ul className="space-y-3">
            {tree.map(node =>
              renderNode({
                node,
                depth: 0,
                deletingId,
                expandedNodeIds,
                selectedNodeId,
                onToggleNode: handleToggleNode,
                onDeleteNode: handleDeleteNode,
                onSelectNode,
                onCreateNode,
                onEditNode,
              }),
            )}
          </ul>
        </div>
      )}
    </section>
  );
};

export default NodeTree;
