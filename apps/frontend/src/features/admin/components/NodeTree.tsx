import { useEffect, useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ChevronRight,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";

import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NodeListItemDTO } from "@/features/admin/api/nodes.api";
import { useNodes } from "@/features/admin/hooks/useNodes";
import { cn } from "@/lib/utils";

type FlowRow = {
  level: number;
  parentNode: NodeListItemDTO | null;
  nodes: NodeListItemDTO[];
  activeNodeId: number | null;
};

type Connector = {
  fromNodeId: number;
  toNodeId: number;
  path: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export interface NodeTreeProps {
  className?: string;
  selectedNodeId?: number | null;
  onSelectNode?: (node: NodeListItemDTO) => void;
  onInspectNode?: (node: NodeListItemDTO) => void;
  onCreateNode?: (parent: NodeListItemDTO | null) => void;
  onDeleteNode?: (node: NodeListItemDTO) => void;
}

const sortNodes = (left: NodeListItemDTO, right: NodeListItemDTO): number => {
  if (left.display_order !== right.display_order) {
    return left.display_order - right.display_order;
  }

  return left.title.localeCompare(right.title, "pt-BR");
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

const buildChildrenByParent = (
  nodes: NodeListItemDTO[],
): Map<number | null, NodeListItemDTO[]> => {
  const childrenByParent = new Map<number | null, NodeListItemDTO[]>();

  nodes.forEach(node => {
    const parentId = node.parent_id ?? null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(parentId, siblings);
  });

  childrenByParent.forEach(children => {
    children.sort(sortNodes);
  });

  return childrenByParent;
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

const buildFlowRows = (
  roots: NodeListItemDTO[],
  childrenByParent: Map<number | null, NodeListItemDTO[]>,
  selectedPath: NodeListItemDTO[],
): FlowRow[] => {
  const rows: FlowRow[] = [
    {
      level: 1,
      parentNode: null,
      nodes: roots,
      activeNodeId: selectedPath[0]?.id ?? null,
    },
  ];

  selectedPath.forEach((node, index) => {
    const children = childrenByParent.get(node.id) ?? [];

    if (children.length === 0) {
      return;
    }

    rows.push({
      level: index + 2,
      parentNode: node,
      nodes: children,
      activeNodeId: selectedPath[index + 1]?.id ?? null,
    });
  });

  return rows;
};

const highlightText = (value: string, query: string) => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return value;
  }

  const lowerValue = value.toLowerCase();
  const lowerQuery = normalizedQuery.toLowerCase();
  const matchIndex = lowerValue.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return value;
  }

  const before = value.slice(0, matchIndex);
  const match = value.slice(matchIndex, matchIndex + normalizedQuery.length);
  const after = value.slice(matchIndex + normalizedQuery.length);

  return (
    <>
      {before}
      <mark className="rounded-sm bg-[#F4DFC7] px-0.5 text-inherit">{match}</mark>
      {after}
    </>
  );
};

const headingStyle = {
  fontFamily: "var(--font-heading-family)",
  fontSize: "clamp(2rem, 3vw, var(--font-heading-size))",
  fontWeight: 700,
  lineHeight: "var(--font-heading-line-height)",
} as const;

const subtitleStyle = {
  fontFamily: "var(--font-body-family)",
  fontSize: "var(--font-subtitle-size)",
  fontWeight: 500,
  lineHeight: "var(--font-subtitle-line-height)",
} as const;

const bodyStyle = {
  fontFamily: "var(--font-body-family)",
  fontSize: "var(--font-body-size)",
  fontWeight: 400,
  lineHeight: "var(--font-body-line-height)",
} as const;

const captionStyle = {
  fontFamily: "var(--font-body-family)",
  fontSize: "var(--font-caption-size)",
  fontWeight: 400,
  lineHeight: "var(--font-caption-line-height)",
} as const;

const NodeTree = ({
  className,
  selectedNodeId,
  onSelectNode,
  onInspectNode,
  onCreateNode,
  onDeleteNode,
}: NodeTreeProps) => {
  const { nodes, isLoading, isError, error, refetch } = useNodes();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchAnnouncement, setSearchAnnouncement] = useState<string | null>(
    null,
  );
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const nodeButtonRefs = useRef(new Map<number, HTMLButtonElement | null>());

  const nodeMap = useMemo(() => {
    const nextMap = new Map<number, NodeListItemDTO>();
    nodes.forEach(node => {
      nextMap.set(node.id, node);
    });
    return nextMap;
  }, [nodes]);

  const childrenByParent = useMemo(
    () => buildChildrenByParent(nodes),
    [nodes],
  );

  const rootNodes = useMemo(
    () => (childrenByParent.get(null) ?? []).slice().sort(sortNodes),
    [childrenByParent],
  );

  const selectedNode =
    selectedNodeId != null ? (nodeMap.get(selectedNodeId) ?? null) : null;
  const selectedPath = useMemo(
    () => buildNodePath(nodeMap, selectedNodeId),
    [nodeMap, selectedNodeId],
  );

  const flowRows = useMemo(
    () => buildFlowRows(rootNodes, childrenByParent, selectedPath),
    [childrenByParent, rootNodes, selectedPath],
  );

  const searchResults = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (normalizedSearch.length === 0) {
      return [];
    }

    return nodes
      .filter(
        node =>
          node.title.toLowerCase().includes(normalizedSearch) ||
          node.slug.toLowerCase().includes(normalizedSearch),
      )
      .sort(sortNodes)
      .slice(0, 8);
  }, [nodes, searchTerm]);

  useEffect(() => {
    const boardElement = boardRef.current;

    if (!boardElement || selectedPath.length < 2) {
      setConnectors([]);
      return;
    }

    const computeConnectors = () => {
      if (!boardRef.current) {
        setConnectors([]);
        return;
      }

      const boardRect = boardRef.current.getBoundingClientRect();
      const nextConnectors: Connector[] = [];

      for (let index = 0; index < selectedPath.length - 1; index += 1) {
        const parentNode = selectedPath[index];
        const childNode = selectedPath[index + 1];
        const parentElement = nodeButtonRefs.current.get(parentNode.id);
        const childElement = nodeButtonRefs.current.get(childNode.id);

        if (!parentElement || !childElement) {
          continue;
        }

        const parentRect = parentElement.getBoundingClientRect();
        const childRect = childElement.getBoundingClientRect();

        const startX = parentRect.left + parentRect.width / 2 - boardRect.left;
        const startY = parentRect.bottom - boardRect.top - 6;
        const endX = childRect.left + childRect.width / 2 - boardRect.left;
        const endY = childRect.top - boardRect.top + 6;
        const verticalDistance = endY - startY;
        const horizontalDistance = Math.abs(endX - startX);
        const curveLift = Math.max(34, Math.min(72, verticalDistance * 0.58));
        const curveSpread = Math.max(20, Math.min(56, horizontalDistance * 0.16));

        nextConnectors.push({
          fromNodeId: parentNode.id,
          toNodeId: childNode.id,
          startX,
          startY,
          endX,
          endY,
          path: `M ${startX} ${startY} C ${startX} ${startY + curveLift}, ${endX} ${Math.max(startY + curveLift * 0.65, endY - curveSpread)}, ${endX} ${endY}`,
        });
      }

      setConnectors(nextConnectors);
    };

    const frameId = window.requestAnimationFrame(computeConnectors);
    const scrollContainers = Array.from(
      boardElement.querySelectorAll<HTMLElement>("[data-flow-scroll]"),
    );
    window.addEventListener("resize", computeConnectors);
    scrollContainers.forEach(container => {
      container.addEventListener("scroll", computeConnectors, { passive: true });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", computeConnectors);
      scrollContainers.forEach(container => {
        container.removeEventListener("scroll", computeConnectors);
      });
    };
  }, [selectedPath, flowRows]);

  const handleSelectNode = (node: NodeListItemDTO) => {
    setSearchAnnouncement(`Foco movido para ${node.title}`);
    onSelectNode?.(node);
  };

  const handleGoToParent = () => {
    if (selectedPath.length < 2) {
      return;
    }

    const parentNode = selectedPath[selectedPath.length - 2];
    if (parentNode) {
      onSelectNode?.(parentNode);
    }
  };

  const actionButtonLabel = selectedNode ? "Adicionar opcao" : "Adicionar raiz";

  if (isLoading) {
    return <LoadingSpinner message="Carregando estrutura de nos..." />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Erro ao carregar a estrutura"
        message={getErrorMessage(error, "Tente novamente em instantes.")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--primary-dark)]/65" />
            <Input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar no por titulo ou slug"
              className="border-[var(--border)] bg-white pl-9 text-[var(--foreground)] placeholder:text-[var(--primary-dark)]/55 focus-visible:border-[var(--primary)] focus-visible:ring-[color:var(--ring)]"
            />

            {searchResults.length > 0 ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-20 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_18px_32px_rgba(58,41,16,0.12)]">
                {searchResults.map(node => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleSelectNode(node)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--surface)] active:bg-[#ece3d4]"
                  >
                    <div className="min-w-0">
                      <p
                        className="truncate font-semibold text-[var(--foreground)]"
                        style={captionStyle}
                      >
                        {highlightText(node.title, searchTerm)}
                      </p>
                      <p
                        className="truncate text-[var(--primary-dark)]/65"
                        style={{ ...captionStyle, fontSize: "0.82rem" }}
                      >
                        /{node.slug}
                      </p>
                    </div>

                    {node.childrenCount > 0 ? (
                      <ChevronRight
                        className="size-4 shrink-0 text-[var(--primary-dark)]/55"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div
            className="min-h-5 text-[var(--primary-dark)]/75"
            style={{ ...captionStyle, fontSize: "0.9rem" }}
          >
            {selectedPath.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {selectedPath.map((node, index) => (
                  <div key={node.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectNode(node)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedNodeId === node.id
                          ? "font-semibold text-[var(--primary-dark)]"
                          : "hover:text-[var(--primary-dark)]",
                      )}
                      style={captionStyle}
                    >
                      {node.title}
                    </button>
                    {index < selectedPath.length - 1 ? (
                      <ChevronRight
                        className="size-4 text-[var(--primary-dark)]/35"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              "Selecione uma raiz para abrir o fluxo."
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGoToParent}
            disabled={selectedPath.length < 2}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar ao pai
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[36px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_22px_40px_rgba(40,24,7,0.08)]">
        <div className="flex items-center justify-center px-6 pt-7">
          <div className="flex items-center gap-3">
            <div className="size-14 overflow-hidden rounded-full border-2 border-[var(--primary-dark)]/25 bg-white shadow-[0_6px_16px_rgba(125,0,0,0.08)]">
              <img
                src="/care.svg"
                alt="Caré"
                className="h-full w-full object-cover"
              />
            </div>
            <h2
              className="tracking-[-0.03em] text-[var(--foreground)]"
              style={headingStyle}
            >
              Caré
            </h2>
          </div>
        </div>

        <p
          className="px-6 pt-3 text-center italic tracking-[-0.02em] text-[var(--foreground)]"
          style={subtitleStyle}
        >
          O que voce deseja?
        </p>

        <div
          ref={boardRef}
          className="relative min-h-[560px] px-8 pb-26 pt-8 lg:px-12"
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="care-flow-connector" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--emphasis)" stopOpacity="0.82" />
                <stop offset="100%" stopColor="var(--primary-dark)" stopOpacity="0.9" />
              </linearGradient>
              <filter id="care-flow-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.4" />
              </filter>
            </defs>

            {connectors.map(connector => (
              <g key={`${connector.fromNodeId}-${connector.toNodeId}`}>
                <path
                  d={connector.path}
                  fill="none"
                  stroke="rgba(125, 0, 0, 0.12)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  filter="url(#care-flow-glow)"
                />
                <path
                  d={connector.path}
                  fill="none"
                  stroke="url(#care-flow-connector)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-200 ease-out"
                />
                <circle
                  cx={connector.startX}
                  cy={connector.startY}
                  r="3.5"
                  fill="var(--surface)"
                  stroke="var(--emphasis)"
                  strokeWidth="1.5"
                />
                <circle
                  cx={connector.endX}
                  cy={connector.endY}
                  r="3.5"
                  fill="var(--surface)"
                  stroke="var(--primary-dark)"
                  strokeWidth="1.5"
                />
              </g>
            ))}
          </svg>

          <div className="space-y-10">
            {flowRows.map(row => (
              <div
                key={`level-${row.level}-${row.parentNode?.id ?? "root"}`}
                className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-5"
              >
                <div
                  className="pt-8 text-right italic text-[var(--foreground)]"
                  style={bodyStyle}
                >
                  Nivel {row.level}
                </div>

                <div data-flow-scroll className="overflow-x-auto pb-2">
                  <div className="mx-auto flex w-max min-w-full justify-center gap-3 px-4">
                    {row.nodes.map(node => {
                      const isSelected = row.activeNodeId === node.id;
                      const isRoot = node.parent_id === null;
                      const isLeaf = node.childrenCount === 0;
                      const isOnPath = selectedPath.some(
                        pathNode => pathNode.id === node.id,
                      );

                      return (
                        <button
                          key={node.id}
                          type="button"
                          ref={element => {
                            nodeButtonRefs.current.set(node.id, element);
                          }}
                          onClick={() => handleSelectNode(node)}
                          className={cn(
                            "flex min-h-[116px] w-[176px] cursor-pointer flex-col justify-center rounded-[24px] px-5 py-4 text-center transition-all duration-200 focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]",
                            "hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(53,39,18,0.08)] active:translate-y-0",
                            isSelected
                              ? "border-2 border-[var(--primary-dark)] bg-white text-[var(--foreground)] shadow-[0_14px_26px_rgba(125,0,0,0.12)]"
                              : isRoot
                                ? "border border-[var(--border)] bg-[#E7E1D3] text-[var(--foreground)]"
                                : isLeaf
                                  ? "border border-[var(--border)] bg-[#E5E2DA] text-[var(--foreground)]"
                                  : "border border-[var(--border)] bg-[#DDD6C8] text-[var(--foreground)]",
                            isOnPath && !isSelected && "ring-2 ring-[var(--primary-dark)]/12",
                          )}
                          aria-pressed={isSelected}
                        >
                          <span
                            className={cn(
                              "line-clamp-3 tracking-[-0.02em]",
                              isSelected ? "font-black" : "font-semibold",
                            )}
                            style={{ ...captionStyle, fontSize: "1rem", lineHeight: "1.3" }}
                          >
                            {highlightText(node.title, searchTerm)}
                          </span>

                          {node.childrenCount > 0 ? (
                            <span className="mt-3 inline-flex items-center justify-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--primary-dark)]/72">
                              Abrir
                              <ChevronRight className="size-3.5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute inset-x-8 bottom-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:inset-x-12">
            <Button
              type="button"
              variant="destructive"
              disabled={!selectedNode || selectedNode.childrenCount > 0}
              title={
                selectedNode && selectedNode.childrenCount > 0
                  ? "Remova os filhos antes de excluir este no."
                  : undefined
              }
              onClick={() => {
                if (selectedNode) {
                  onDeleteNode?.(selectedNode);
                }
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Deletar
            </Button>

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onCreateNode?.(selectedNode ?? null)}
              >
                <PlusCircle className="size-4" aria-hidden="true" />
                {actionButtonLabel}
              </Button>

              <Button
                type="button"
                variant="ghost"
                disabled={!selectedNode}
                onClick={() => {
                  if (selectedNode) {
                    onInspectNode?.(selectedNode);
                  }
                }}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {searchAnnouncement}
      </div>
    </section>
  );
};

export default NodeTree;
