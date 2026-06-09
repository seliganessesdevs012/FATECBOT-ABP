import { useMemo } from "react";
import { ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NodeListItemDTO } from "@/features/admin/api/nodes.api";
import { cn } from "@/lib/utils";

import NodeEditor from "./NodeEditor";

export type NodeInspectorState =
  | { mode: "view"; nodeId: number }
  | { mode: "create"; parentNode: NodeListItemDTO | null }
  | { mode: "edit"; node: NodeListItemDTO }
  | null;

export interface NodeInspectorProps {
  nodes: NodeListItemDTO[];
  state: NodeInspectorState;
  isDeleting?: boolean;
  onNodeSaved?: (message: string) => void;
  onSelectNode: (node: NodeListItemDTO) => void;
  onCreateNode: (parentNode: NodeListItemDTO | null) => void;
  onEditNode: (node: NodeListItemDTO) => void;
  onClose: () => void;
  onDeleteNode: (node: NodeListItemDTO) => void;
}

const sortNodes = (left: NodeListItemDTO, right: NodeListItemDTO): number => {
  if (left.display_order !== right.display_order) {
    return left.display_order - right.display_order;
  }

  return left.title.localeCompare(right.title, "pt-BR");
};

const buildNodePath = (
  nodeMap: Map<number, NodeListItemDTO>,
  nodeId?: number | null,
): NodeListItemDTO[] => {
  if (!nodeId) {
    return [];
  }

  const path: NodeListItemDTO[] = [];
  let cursor = nodeMap.get(nodeId) ?? null;

  while (cursor) {
    path.unshift(cursor);
    cursor =
      cursor.parent_id !== null ? (nodeMap.get(cursor.parent_id) ?? null) : null;
  }

  return path;
};

const describeNode = (
  node: NodeListItemDTO,
  nodeMap: Map<number, NodeListItemDTO>,
): string => {
  if (node.parent_id === null) {
    return "Nó raiz";
  }

  if (node.parent_id !== null && !nodeMap.has(node.parent_id)) {
    return "Nó órfão";
  }

  if (node.childrenCount === 0) {
    return "Resposta final";
  }

  return `${node.childrenCount} ${node.childrenCount === 1 ? "filho" : "filhos"}`;
};

const NodeInspector = ({
  nodes,
  state,
  isDeleting = false,
  onNodeSaved,
  onSelectNode,
  onCreateNode,
  onEditNode,
  onClose,
  onDeleteNode,
}: NodeInspectorProps) => {
  const nodeMap = useMemo(() => {
    const nextMap = new Map<number, NodeListItemDTO>();
    nodes.forEach(node => {
      nextMap.set(node.id, node);
    });
    return nextMap;
  }, [nodes]);

  const selectedNode =
    state?.mode === "view"
      ? (nodeMap.get(state.nodeId) ?? null)
      : state?.mode === "edit"
        ? (nodeMap.get(state.node.id) ?? state.node)
        : state?.parentNode ?? null;

  const selectedPath = useMemo(
    () =>
      buildNodePath(
        nodeMap,
        state?.mode === "view"
          ? state.nodeId
          : state?.mode === "edit"
            ? state.node.id
            : state?.parentNode?.id ?? null,
      ),
    [nodeMap, state],
  );

  const childNodes = useMemo(() => {
    if (!selectedNode || state?.mode !== "view") {
      return [];
    }

    return nodes
      .filter(node => node.parent_id === selectedNode.id)
      .sort(sortNodes);
  }, [nodes, selectedNode, state?.mode]);

  if (!state) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
      <button
        type="button"
        aria-label="Fechar painel"
        className="flex-1 cursor-pointer"
        onClick={onClose}
      />

      <aside className="relative h-full w-full max-w-[440px] overflow-hidden border-l border-[#E4D9C7] bg-[#FCF9F3] shadow-[-18px_0_36px_rgba(35,28,22,0.12)]">
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-[#E8DDCC] px-5 py-4">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8A7865]">
                {state.mode === "view"
                  ? "Detalhes"
                  : state.mode === "edit"
                    ? "Editar nó"
                    : "Novo nó"}
              </p>
              <h2 className="mt-1 truncate text-xl font-black text-[#1C1C1C]">
                {state.mode === "view"
                  ? selectedNode?.title ?? "Nó"
                  : state.mode === "edit"
                    ? selectedNode?.title ?? "Editar nó"
                    : state.parentNode
                      ? `Filho de ${state.parentNode.title}`
                      : "Nó raiz"}
              </h2>
            </div>

            <Button type="button" variant="outline" size="icon" onClick={onClose}>
              <X className="size-4" aria-hidden="true" />
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto">
            {state.mode === "create" ? (
              <div className="px-5 py-5">
                <NodeEditor
                  parentNode={state.parentNode}
                  className="border-none bg-transparent p-0 shadow-none"
                  onCancel={onClose}
                  onSuccess={message => {
                    onNodeSaved?.(message);
                    onClose();
                  }}
                />
              </div>
            ) : null}

            {state.mode === "edit" ? (
              <div className="px-5 py-5">
                <NodeEditor
                  nodeId={state.node.id}
                  className="border-none bg-transparent p-0 shadow-none"
                  onCancel={onClose}
                  onSuccess={message => {
                    onNodeSaved?.(message);
                    onClose();
                  }}
                />
              </div>
            ) : null}

            {state.mode === "view" && selectedNode ? (
              <div className="px-5 py-5">
                <section className="border-b border-[#E8DDCC] pb-5">
                  <p className="text-sm font-semibold text-[#1C1C1C]">
                    /{selectedNode.slug}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6F675D]">
                    <span>{describeNode(selectedNode, nodeMap)}</span>
                    <span>{selectedNode.is_active ? "Ativo" : "Inativo"}</span>
                    <span>Ordem {selectedNode.display_order}</span>
                  </div>
                </section>

                <section className="border-b border-[#E8DDCC] py-5">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#8A7865]">
                    Caminho
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    {selectedPath.map((node, index) => (
                      <div key={node.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectNode(node);
                            onClose();
                          }}
                          className={cn(
                            "cursor-pointer transition-colors",
                            node.id === selectedNode.id
                              ? "font-semibold text-[#1C1C1C]"
                              : "text-[#6F675D] hover:text-[#1C1C1C]",
                          )}
                        >
                          {node.title}
                        </button>
                        {index < selectedPath.length - 1 ? (
                          <ChevronRight className="size-4 text-[#A18F79]" aria-hidden="true" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border-b border-[#E8DDCC] py-5">
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#8A7865]">
                        Veio de
                      </dt>
                      <dd className="mt-1 text-sm text-[#1C1C1C]">
                        {selectedPath.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectNode(selectedPath[selectedPath.length - 2]);
                              onClose();
                            }}
                            className="cursor-pointer font-semibold transition-colors hover:text-[#7D120D]"
                          >
                            {selectedPath[selectedPath.length - 2].title}
                          </button>
                        ) : (
                          "Raiz do chatbot"
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#8A7865]">
                        Leva para
                      </dt>
                      <dd className="mt-2 space-y-2 text-sm text-[#1C1C1C]">
                        {childNodes.length > 0 ? (
                          childNodes.map(childNode => (
                            <button
                              key={childNode.id}
                              type="button"
                              onClick={() => {
                                onSelectNode(childNode);
                                onClose();
                              }}
                              className="block cursor-pointer text-left font-semibold transition-colors hover:text-[#7D120D]"
                            >
                              {childNode.title}
                            </button>
                          ))
                        ) : (
                          <span className="text-[#6F675D]">
                            Este nó encerra o fluxo.
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="py-5">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => onEditNode(selectedNode)}>
                      <Pencil className="size-4" aria-hidden="true" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onCreateNode(selectedNode)}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Novo filho
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onCreateNode(null)}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Nova raiz
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    className="mt-4"
                    disabled={selectedNode.childrenCount > 0 || isDeleting}
                    title={
                      selectedNode.childrenCount > 0
                          ? "Remova os filhos antes de excluir este nó."
                          : undefined
                    }
                    onClick={() => onDeleteNode(selectedNode)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                      {isDeleting ? "Removendo..." : "Excluir nó"}
                  </Button>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default NodeInspector;
