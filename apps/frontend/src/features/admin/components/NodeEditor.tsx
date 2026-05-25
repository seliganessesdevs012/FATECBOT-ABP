import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  nodesApi,
  type CreateNodePayload,
  type NodeListItemDTO,
} from "@/features/admin/api/nodes.api";
import { useNodes } from "@/features/admin/hooks/useNodes";
import { getApiErrorMessage } from "@/lib/api-feedback";
import { fileToBase64 } from "@/lib/file";
import { cn } from "@/lib/utils";
import type { ChatNode } from "@/features/chatbot/types/chatbot.types";

const ROOT_PARENT_VALUE = "root";

type NodeKind = "menu" | "response";

const nodeEditorSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Titulo deve ter no minimo 3 caracteres"),
    slug: z
      .string()
      .trim()
      .min(3, "Slug deve ter no minimo 3 caracteres")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use apenas letras minusculas, numeros e hifens",
      ),
    parent_id: z.string().min(1, "Selecione um no pai"),
    display_order: z
      .union([z.string(), z.number()])
      .transform(value => Number(value))
      .pipe(
        z
          .number()
          .int("A ordem deve ser um numero inteiro")
          .min(1, "A ordem deve ser maior ou igual a 1"),
      ),
    node_kind: z.enum(["menu", "response"]),
    prompt: z.string(),
    answer_summary: z.string(),
    evidence_excerpt: z.string(),
    evidence_source: z.string(),
    evidence_file: z
      .preprocess(value => {
        if (value instanceof FileList) {
          return value.length > 0 ? value[0] : undefined;
        }

        return value instanceof File ? value : undefined;
      }, z.instanceof(File).optional())
      .refine(
        file => !file || file.type === "application/pdf",
        "Selecione um arquivo PDF",
      )
      .refine(
        file => !file || file.size <= 5 * 1024 * 1024,
        "O PDF deve ter no maximo 5MB",
      ),
    is_active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const prompt = normalizeOptionalText(values.prompt);
    const answerSummary = normalizeOptionalText(values.answer_summary);
    const evidenceExcerpt = normalizeOptionalText(values.evidence_excerpt);
    const evidenceSource = normalizeOptionalText(values.evidence_source);

    if (values.node_kind === "menu" && !prompt) {
      ctx.addIssue({
        code: "custom",
        path: ["prompt"],
        message: "Informe a pergunta exibida neste menu",
      });
    }

    if (values.node_kind === "response" && !answerSummary) {
      ctx.addIssue({
        code: "custom",
        path: ["answer_summary"],
        message: "Informe a resposta final do no",
      });
    }

    if (values.node_kind === "response" && evidenceExcerpt && !evidenceSource) {
      ctx.addIssue({
        code: "custom",
        path: ["evidence_source"],
        message: "Selecione o arquivo da evidencia",
      });
    }

    if (values.node_kind === "response" && evidenceSource && !evidenceExcerpt) {
      ctx.addIssue({
        code: "custom",
        path: ["evidence_excerpt"],
        message: "Informe o trecho da evidencia",
      });
    }
  });

type NodeEditorFormValues = z.infer<typeof nodeEditorSchema>;
type NodeEditorFormInput = Omit<
  z.input<typeof nodeEditorSchema>,
  "display_order"
> & {
  display_order: string | number;
};

interface ParentOption {
  value: string;
  label: string;
}

export interface NodeEditorProps {
  className?: string;
  nodeId?: number | null;
  parentNode?: NodeListItemDTO | null;
  onCancel?: () => void;
  onSuccess?: (message: string) => void;
}

const EMPTY_FORM_VALUES: Omit<
  NodeEditorFormValues,
  "parent_id" | "display_order"
> = {
  title: "",
  slug: "",
  node_kind: "menu",
  prompt: "",
  answer_summary: "",
  evidence_excerpt: "",
  evidence_source: "",
  evidence_file: undefined,
  is_active: true,
};

const sortNodes = (left: NodeListItemDTO, right: NodeListItemDTO): number => {
  if (left.display_order !== right.display_order) {
    return left.display_order - right.display_order;
  }

  return left.title.localeCompare(right.title, "pt-BR");
};

const normalizeOptionalText = (
  value: string | null | undefined,
): string | null => {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
};

const parseParentId = (value: string): number | null => {
  return value === ROOT_PARENT_VALUE ? null : Number(value);
};

const slugify = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
};

const getSuggestedDisplayOrder = (
  nodes: NodeListItemDTO[],
  parentId: number | null,
): number => {
  const siblingOrders = nodes
    .filter(node => (node.parent_id ?? null) === parentId)
    .map(node => node.display_order);

  if (siblingOrders.length === 0) {
    return 1;
  }

  return Math.max(...siblingOrders) + 1;
};

const buildParentOptions = (
  nodes: NodeListItemDTO[],
  currentNodeId?: number | null,
): ParentOption[] => {
  const childrenByParent = new Map<number | null, NodeListItemDTO[]>();

  nodes.forEach(node => {
    const parentId = node.parent_id ?? null;
    const children = childrenByParent.get(parentId) ?? [];
    children.push(node);
    childrenByParent.set(parentId, children);
  });

  childrenByParent.forEach(children => {
    children.sort(sortNodes);
  });

  const options: ParentOption[] = [
    {
      value: ROOT_PARENT_VALUE,
      label: "Sem pai (no raiz)",
    },
  ];

  const visit = (parentId: number | null, prefix: string) => {
    const children = childrenByParent.get(parentId) ?? [];

    children.forEach(node => {
      if (currentNodeId === node.id) {
        return;
      }

      const label = prefix ? `${prefix} / ${node.title}` : node.title;

      options.push({
        value: String(node.id),
        label,
      });

      visit(node.id, label);
    });
  };

  visit(null, "");

  return options;
};

const inferNodeKind = ({
  answerSummary,
  hasChildren,
  isRootCreate,
}: {
  answerSummary: string | null | undefined;
  hasChildren: boolean;
  isRootCreate?: boolean;
}): NodeKind => {
  if (hasChildren) {
    return "menu";
  }

  if (normalizeOptionalText(answerSummary)) {
    return "response";
  }

  return isRootCreate ? "menu" : "response";
};

const toFormValues = (
  node: ChatNode,
  childrenCount: number,
): NodeEditorFormValues => ({
  title: node.title,
  slug: node.slug,
  parent_id:
    node.parent_id === null ? ROOT_PARENT_VALUE : String(node.parent_id),
  display_order: node.display_order,
  node_kind: inferNodeKind({
    answerSummary: node.answer_summary,
    hasChildren: childrenCount > 0 || node.children.length > 0,
  }),
  prompt: node.prompt ?? "",
  answer_summary: node.answer_summary ?? "",
  evidence_excerpt: node.evidence_excerpt ?? "",
  evidence_source: node.evidence_source ?? "",
  evidence_file: undefined,
  is_active: node.is_active,
});

const buildCreateDefaults = (
  nodes: NodeListItemDTO[],
  parentId: number | null,
): NodeEditorFormValues => ({
  ...EMPTY_FORM_VALUES,
  node_kind: inferNodeKind({
    answerSummary: null,
    hasChildren: false,
    isRootCreate: parentId === null,
  }),
  parent_id: parentId === null ? ROOT_PARENT_VALUE : String(parentId),
  display_order: getSuggestedDisplayOrder(nodes, parentId),
});

const buildNodePayload = (
  values: NodeEditorFormValues,
): Pick<
  CreateNodePayload,
  | "title"
  | "slug"
  | "prompt"
  | "answer_summary"
  | "evidence_excerpt"
  | "evidence_source"
  | "display_order"
  | "is_active"
> => {
  const isMenu = values.node_kind === "menu";

  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    prompt: isMenu ? normalizeOptionalText(values.prompt) : null,
    answer_summary: isMenu
      ? null
      : normalizeOptionalText(values.answer_summary),
    evidence_excerpt: isMenu
      ? null
      : normalizeOptionalText(values.evidence_excerpt),
    evidence_source: isMenu ? null : normalizeOptionalText(values.evidence_source),
    display_order: values.display_order,
    is_active: values.is_active,
  };
};

const buildSubmissionPayload = async (
  values: NodeEditorFormValues,
): Promise<Omit<CreateNodePayload, "parent_id">> => {
  const payload = buildNodePayload(values);

  if (values.node_kind !== "response" || !(values.evidence_file instanceof File)) {
    return payload;
  }

  return {
    ...payload,
    evidence_source: values.evidence_file.name,
    evidence_file_name: values.evidence_file.name,
    evidence_file_mime_type: values.evidence_file.type,
    evidence_file_data: await fileToBase64(values.evidence_file),
  };
};

const selectTriggerClasses =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

const textareaClasses =
  "min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50";

const NodeEditor = ({
  className,
  nodeId,
  parentNode,
  onCancel,
  onSuccess,
}: NodeEditorProps) => {
  const isEditMode = typeof nodeId === "number";
  const parentNodeId = parentNode?.id ?? null;
  const {
    nodes,
    isLoading: isNodesLoading,
    isError: isNodesError,
    error: nodesError,
    refetch,
    createNode,
    updateNode,
  } = useNodes();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isOpeningEvidence, setIsOpeningEvidence] = useState(false);
  const previousParentNodeIdRef = useRef<number | null>(parentNodeId);
  const evidenceFileInputRef = useRef<HTMLInputElement | null>(null);

  const nodeDetailsQuery = useQuery({
    queryKey: ["admin", "nodes", "editor", nodeId],
    queryFn: () => nodesApi.getById(nodeId as number),
    enabled: isEditMode,
  });

  const currentListNode = useMemo(
    () => nodes.find(node => node.id === nodeId) ?? null,
    [nodeId, nodes],
  );
  const isNodeKindLocked = Boolean(
    isEditMode && currentListNode && currentListNode.childrenCount > 0,
  );

  const parentOptions = useMemo(
    () => buildParentOptions(nodes, nodeId),
    [nodeId, nodes],
  );
  const initialCreateValues = useMemo(
    () => buildCreateDefaults(nodes, parentNodeId),
    [nodes, parentNodeId],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<NodeEditorFormInput, unknown, NodeEditorFormValues>({
    resolver: zodResolver(nodeEditorSchema),
    mode: "onChange",
    defaultValues: initialCreateValues,
  });

  const watchedTitle = useWatch({ control, name: "title" });
  const watchedParentId = useWatch({ control, name: "parent_id" });
  const watchedEvidenceSource = useWatch({ control, name: "evidence_source" });
  const watchedNodeKind = useWatch({ control, name: "node_kind" });

  const selectedParentId = parseParentId(watchedParentId ?? ROOT_PARENT_VALUE);
  const selectedParent = useMemo(() => {
    if (selectedParentId === null) {
      return null;
    }

    return nodes.find(node => node.id === selectedParentId) ?? parentNode ?? null;
  }, [nodes, parentNode, selectedParentId]);

  const isBusy = isNodesLoading || nodeDetailsQuery.isFetching;
  const persistedEvidenceSource = normalizeOptionalText(
    nodeDetailsQuery.data?.evidence_source,
  );
  const selectedEvidenceSource = normalizeOptionalText(watchedEvidenceSource);

  const applyNodeKind = (
    nextKind: NodeKind,
    options?: {
      shouldDirty?: boolean;
      shouldTouch?: boolean;
      shouldValidate?: boolean;
    },
  ) => {
    const shouldDirty = options?.shouldDirty ?? true;
    const shouldTouch = options?.shouldTouch ?? true;
    const shouldValidate = options?.shouldValidate ?? true;

    setValue("node_kind", nextKind, {
      shouldDirty,
      shouldTouch,
      shouldValidate,
    });

    if (nextKind === "menu") {
      setValue("answer_summary", "", { shouldDirty, shouldTouch, shouldValidate });
      setValue("evidence_excerpt", "", {
        shouldDirty,
        shouldTouch,
        shouldValidate,
      });
      setValue("evidence_source", "", {
        shouldDirty,
        shouldTouch,
        shouldValidate,
      });
      setValue("evidence_file", undefined, {
        shouldDirty,
        shouldTouch,
        shouldValidate,
      });
      if (evidenceFileInputRef.current) {
        evidenceFileInputRef.current.value = "";
      }
      return;
    }

    setValue("prompt", "", { shouldDirty, shouldTouch, shouldValidate });
  };

  useEffect(() => {
    if (isEditMode || dirtyFields.slug) {
      return;
    }

    setValue("slug", slugify(watchedTitle ?? ""), {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [dirtyFields.slug, isEditMode, setValue, watchedTitle]);

  useEffect(() => {
    if (isEditMode || dirtyFields.display_order) {
      return;
    }

    setValue("display_order", getSuggestedDisplayOrder(nodes, selectedParentId), {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [
    dirtyFields.display_order,
    isEditMode,
    nodes,
    selectedParentId,
    setValue,
  ]);

  useEffect(() => {
    if (isNodeKindLocked && watchedNodeKind !== "menu") {
      applyNodeKind("menu", {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [applyNodeKind, isNodeKindLocked, watchedNodeKind]);

  useEffect(() => {
    if (!isEditMode || !nodeDetailsQuery.data) {
      return;
    }

    reset(
      toFormValues(nodeDetailsQuery.data, currentListNode?.childrenCount ?? 0),
    );
  }, [currentListNode?.childrenCount, isEditMode, nodeDetailsQuery.data, reset]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    if (previousParentNodeIdRef.current === parentNodeId) {
      return;
    }

    previousParentNodeIdRef.current = parentNodeId;
    reset(buildCreateDefaults(nodes, parentNodeId));
  }, [isEditMode, nodes, parentNodeId, reset]);

  const handleReset = () => {
    setSubmitError(null);
    setSuccessMessage(null);

    if (evidenceFileInputRef.current) {
      evidenceFileInputRef.current.value = "";
    }

    if (onCancel) {
      onCancel();
      return;
    }

    if (isEditMode && nodeDetailsQuery.data) {
      reset(
        toFormValues(nodeDetailsQuery.data, currentListNode?.childrenCount ?? 0),
      );
      return;
    }

    reset(initialCreateValues);
  };

  const handleEvidenceFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setValue("evidence_source", file?.name ?? "", {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const clearEvidenceFile = () => {
    if (evidenceFileInputRef.current) {
      evidenceFileInputRef.current.value = "";
    }

    setValue("evidence_file", undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("evidence_source", "", {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleOpenEvidence = async () => {
    if (!nodeId) {
      return;
    }

    setSubmitError(null);
    setIsOpeningEvidence(true);

    try {
      const fileBlob = await nodesApi.downloadEvidence(nodeId);
      const fileUrl = window.URL.createObjectURL(fileBlob);
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(fileUrl), 60_000);
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          "Nao foi possivel abrir o PDF salvo para este no.",
        ),
      );
    } finally {
      setIsOpeningEvidence(false);
    }
  };

  const onSubmit: SubmitHandler<NodeEditorFormValues> = async values => {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const payload = await buildSubmissionPayload(values);
      const hasUploadedEvidenceFile =
        values.node_kind === "response" && values.evidence_file instanceof File;
      const removedExistingEvidence =
        isEditMode &&
        values.node_kind === "response" &&
        persistedEvidenceSource !== null &&
        !hasUploadedEvidenceFile &&
        normalizeOptionalText(values.evidence_source) === null;
      const nextSuccessMessage = isEditMode
        ? hasUploadedEvidenceFile
          ? "No atualizado com sucesso. O PDF da evidencia foi salvo no backend."
          : removedExistingEvidence
            ? "No atualizado com sucesso. O PDF da evidencia foi removido."
            : "No atualizado com sucesso."
        : hasUploadedEvidenceFile
          ? "No criado com sucesso. O PDF da evidencia foi salvo no backend."
          : "No criado com sucesso.";

      if (isEditMode && nodeId) {
        await updateNode(nodeId, payload);
        const refreshedNode = await nodeDetailsQuery.refetch();

        if (refreshedNode.data) {
          reset(
            toFormValues(
              refreshedNode.data,
              currentListNode?.childrenCount ?? refreshedNode.data.children.length,
            ),
          );
        }

        if (evidenceFileInputRef.current) {
          evidenceFileInputRef.current.value = "";
        }
        setSuccessMessage(nextSuccessMessage);
      } else {
        await createNode({
          ...payload,
          parent_id: parseParentId(values.parent_id),
        });

        const nextValues = buildCreateDefaults(nodes, parseParentId(values.parent_id));
        reset(nextValues);
        if (evidenceFileInputRef.current) {
          evidenceFileInputRef.current.value = "";
        }
        setSuccessMessage(nextSuccessMessage);
      }

      onSuccess?.(nextSuccessMessage);
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          isEditMode
            ? "Nao foi possivel atualizar o no agora."
            : "Nao foi possivel criar o no agora.",
        ),
      );
    }
  };

  if (isNodesLoading || nodeDetailsQuery.isLoading) {
    return <LoadingSpinner message="Carregando dados do editor..." />;
  }

  if (isNodesError) {
    return (
        <ErrorAlert
          title="Erro ao carregar editor"
          message={getApiErrorMessage(nodesError, "Tente novamente em instantes.")}
          onRetry={() => {
            void refetch();
          }}
      />
    );
  }

  if (nodeDetailsQuery.isError) {
    return (
        <ErrorAlert
          title="Erro ao carregar no"
          message={getApiErrorMessage(
            nodeDetailsQuery.error,
            "Nao foi possivel carregar os detalhes do no.",
          )}
        onRetry={() => {
          void nodeDetailsQuery.refetch();
        }}
      />
    );
  }

  return (
    <section
      className={cn(
        "space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <header className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          {isEditMode ? "Editar no" : "Criar no"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? "Edite apenas o essencial para manter o fluxo claro."
            : selectedParent
              ? `Novo filho de ${selectedParent.title}.`
              : "Crie uma nova raiz ou um novo trecho do fluxo."}
        </p>
      </header>

      {successMessage ? (
        <ErrorAlert
          title="Operacao concluida"
          message={successMessage}
          variant="info"
          dismissible
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

      {submitError ? (
        <ErrorAlert
          title={isEditMode ? "Erro ao atualizar no" : "Erro ao criar no"}
          message={submitError}
          dismissible
          onDismiss={() => setSubmitError(null)}
        />
      ) : null}

      <form
        noValidate
        className="space-y-5"
        onSubmit={handleSubmit(values => {
          void onSubmit(values);
        })}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="node-title">Titulo</Label>
            <Input
              id="node-title"
              type="text"
              placeholder="Ex.: Como ingressar"
              aria-invalid={Boolean(errors.title)}
              disabled={isBusy}
              {...register("title")}
            />
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="node-slug">Slug</Label>
            <Input
              id="node-slug"
              type="text"
              placeholder="como-ingressar"
              aria-invalid={Boolean(errors.slug)}
              disabled={isBusy}
              {...register("slug")}
            />
            {errors.slug ? (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Identificador unico do no.
              </p>
            )}
          </div>

          {isEditMode ? (
            <div className="space-y-1">
              <input type="hidden" {...register("parent_id")} />
              <Label htmlFor="node-parent-readonly">No pai</Label>
              <Input
                id="node-parent-readonly"
                type="text"
                readOnly
                value={selectedParent?.title ?? "Sem pai (no raiz)"}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="node-parent">No pai</Label>
              <select
                id="node-parent"
                aria-invalid={Boolean(errors.parent_id)}
                disabled={isBusy}
                className={cn(
                  selectTriggerClasses,
                  errors.parent_id && "border-destructive",
                )}
                {...register("parent_id")}
              >
                {parentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.parent_id ? (
                <p className="text-xs text-destructive">
                  {errors.parent_id.message}
                </p>
              ) : null}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="node-order">Ordem de exibicao</Label>
            <Input
              id="node-order"
              type="number"
              min={1}
              step={1}
              aria-invalid={Boolean(errors.display_order)}
              disabled={isBusy}
              {...register("display_order")}
            />
            {errors.display_order ? (
              <p className="text-xs text-destructive">
                {errors.display_order.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo do no</Label>
          <input type="hidden" {...register("node_kind")} />
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isBusy || isNodeKindLocked}
              onClick={() => applyNodeKind("menu")}
              className={cn(
                "cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                watchedNodeKind === "menu"
                  ? "border-[var(--primary-dark)] bg-[var(--surface)] text-[var(--primary-dark)]"
                  : "border-border bg-white text-foreground hover:bg-muted/30",
              )}
            >
              <p className="font-semibold">Menu de opcoes</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No que abre novas escolhas para o usuario.
              </p>
            </button>

            <button
              type="button"
              disabled={isBusy || isNodeKindLocked}
              onClick={() => applyNodeKind("response")}
              className={cn(
                "cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                watchedNodeKind === "response"
                  ? "border-[var(--primary-dark)] bg-[var(--surface)] text-[var(--primary-dark)]"
                  : "border-border bg-white text-foreground hover:bg-muted/30",
              )}
            >
              <p className="font-semibold">Resposta final</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No que entrega a informacao final do chatbot.
              </p>
            </button>
          </div>

          {isNodeKindLocked ? (
            <p className="text-xs text-muted-foreground">
              Este no ja possui filhos, entao permanece como menu.
            </p>
          ) : null}
        </div>

        {watchedNodeKind === "menu" ? (
          <div className="space-y-1">
            <Label htmlFor="node-prompt">Pergunta exibida</Label>
            <textarea
              id="node-prompt"
              rows={4}
              placeholder="Ex.: O que voce deseja?"
              aria-invalid={Boolean(errors.prompt)}
              disabled={isBusy}
              className={cn(textareaClasses, errors.prompt && "border-destructive")}
              {...register("prompt")}
            />
            {errors.prompt ? (
              <p className="text-xs text-destructive">{errors.prompt.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Texto que conduz o usuario para as proximas opcoes.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1">
              <Label htmlFor="node-answer-summary">Resposta final</Label>
              <textarea
                id="node-answer-summary"
                rows={5}
                placeholder="Escreva a resposta que o chatbot deve entregar."
                aria-invalid={Boolean(errors.answer_summary)}
                disabled={isBusy}
                className={cn(
                  "min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
                  errors.answer_summary && "border-destructive",
                )}
                {...register("answer_summary")}
              />
              {errors.answer_summary ? (
                <p className="text-xs text-destructive">
                  {errors.answer_summary.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="node-evidence-excerpt">Trecho da evidencia</Label>
              <textarea
                id="node-evidence-excerpt"
                rows={4}
                placeholder="Cole o trecho do documento que sustenta a resposta."
                aria-invalid={Boolean(errors.evidence_excerpt)}
                disabled={isBusy}
                className={cn(
                  textareaClasses,
                  errors.evidence_excerpt && "border-destructive",
                )}
                {...register("evidence_excerpt")}
              />
              {errors.evidence_excerpt ? (
                <p className="text-xs text-destructive">
                  {errors.evidence_excerpt.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <input type="hidden" {...register("evidence_source")} />
              <Label htmlFor="node-evidence-file">Arquivo da evidencia</Label>
              <div className="space-y-3 rounded-xl border border-border/70 bg-muted/15 p-4">
                <input
                  id="node-evidence-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  aria-invalid={Boolean(
                    errors.evidence_source || errors.evidence_file,
                  )}
                  disabled={isBusy}
                  className="hidden"
                  {...register("evidence_file", {
                    onChange: handleEvidenceFileChange,
                  })}
                  ref={element => {
                    register("evidence_file").ref(element);
                    evidenceFileInputRef.current = element;
                  }}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="node-evidence-file"
                    className={cn(
                      "inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                      isBusy
                        ? "cursor-not-allowed bg-muted text-muted-foreground"
                        : "bg-[var(--primary-dark)] text-white hover:bg-[var(--primary)]",
                    )}
                  >
                    Selecionar PDF
                  </label>

                  {selectedEvidenceSource ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#4B443B]">
                      {selectedEvidenceSource}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Nenhum arquivo selecionado
                    </span>
                  )}

                  {selectedEvidenceSource ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={clearEvidenceFile}
                    >
                      Remover arquivo
                    </Button>
                  ) : null}
                </div>

                {isEditMode && selectedEvidenceSource && selectedEvidenceSource !== persistedEvidenceSource ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Novo arquivo selecionado: {selectedEvidenceSource}
                    </span>
                  </div>
                ) : null}

                {isEditMode && persistedEvidenceSource ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isBusy || isOpeningEvidence}
                      onClick={() => {
                        void handleOpenEvidence();
                      }}
                    >
                      {isOpeningEvidence ? "Abrindo PDF..." : "Abrir PDF atual"}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Arquivo salvo no backend: {persistedEvidenceSource}
                    </span>
                  </div>
                ) : null}

                {errors.evidence_source ? (
                  <p className="text-xs text-destructive">
                    {errors.evidence_source.message}
                  </p>
                ) : null}

                {errors.evidence_file ? (
                  <p className="text-xs text-destructive">
                    {errors.evidence_file.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-input"
            disabled={isBusy}
            {...register("is_active")}
          />
          <span className="space-y-1 text-sm">
            <span className="block font-medium text-foreground">
              No ativo no chatbot
            </span>
            <span className="block text-muted-foreground">
              Desative temporariamente para esconder o no sem apagar o conteudo.
            </span>
          </span>
        </label>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isBusy}
          >
            {onCancel ? "Cancelar" : isEditMode ? "Restaurar" : "Limpar"}
          </Button>
          <Button type="submit" disabled={isBusy}>
            {isBusy
              ? "Salvando..."
              : isEditMode
                ? "Salvar alteracoes"
                : "Criar no"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default NodeEditor;
