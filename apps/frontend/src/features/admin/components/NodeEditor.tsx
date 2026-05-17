import { useEffect, useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
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
  type UpdateNodePayload,
} from "@/features/admin/api/nodes.api";
import { useNodes } from "@/features/admin/hooks/useNodes";
import { cn } from "@/lib/utils";
import type { ChatNode } from "@/features/chatbot/types/chatbot.types";

const ROOT_PARENT_VALUE = "root";

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
    display_order: z.coerce
      .number()
      .int("A ordem deve ser um numero inteiro")
      .min(1, "A ordem deve ser maior ou igual a 1"),
    prompt: z.string(),
    answer_summary: z.string(),
    evidence_excerpt: z.string(),
    evidence_source: z.string(),
    is_active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const prompt = normalizeOptionalText(values.prompt);
    const answerSummary = normalizeOptionalText(values.answer_summary);
    const evidenceExcerpt = normalizeOptionalText(values.evidence_excerpt);
    const evidenceSource = normalizeOptionalText(values.evidence_source);

    if (!prompt && !answerSummary) {
      ctx.addIssue({
        code: "custom",
        path: ["prompt"],
        message: "Preencha o prompt ou o resumo da resposta",
      });
    }

    if (evidenceExcerpt && !evidenceSource) {
      ctx.addIssue({
        code: "custom",
        path: ["evidence_source"],
        message: "Informe a fonte da evidencia",
      });
    }

    if (evidenceSource && !evidenceExcerpt) {
      ctx.addIssue({
        code: "custom",
        path: ["evidence_excerpt"],
        message: "Informe o trecho da evidencia",
      });
    }
  });

type NodeEditorFormValues = z.infer<typeof nodeEditorSchema>;

interface ParentOption {
  value: string;
  label: string;
}

export interface NodeEditorProps {
  className?: string;
  nodeId?: number | null;
  parentNode?: NodeListItemDTO | null;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const EMPTY_FORM_VALUES: Omit<
  NodeEditorFormValues,
  "parent_id" | "display_order"
> = {
  title: "",
  slug: "",
  prompt: "",
  answer_summary: "",
  evidence_excerpt: "",
  evidence_source: "",
  is_active: true,
};

const sortNodes = (left: NodeListItemDTO, right: NodeListItemDTO): number => {
  if (left.display_order !== right.display_order) {
    return left.display_order - right.display_order;
  }

  return left.title.localeCompare(right.title, "pt-BR");
};

const normalizeOptionalText = (value: string | null | undefined): string | null => {
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

const toFormValues = (node: ChatNode): NodeEditorFormValues => ({
  title: node.title,
  slug: node.slug,
  parent_id:
    node.parent_id === null ? ROOT_PARENT_VALUE : String(node.parent_id),
  display_order: node.display_order,
  prompt: node.prompt ?? "",
  answer_summary: node.answer_summary ?? "",
  evidence_excerpt: node.evidence_excerpt ?? "",
  evidence_source: node.evidence_source ?? "",
  is_active: node.is_active,
});

const buildCreateDefaults = (
  nodes: NodeListItemDTO[],
  parentId: number | null,
): NodeEditorFormValues => ({
  ...EMPTY_FORM_VALUES,
  parent_id: parentId === null ? ROOT_PARENT_VALUE : String(parentId),
  display_order: getSuggestedDisplayOrder(nodes, parentId),
});

const buildCreatePayload = (
  values: NodeEditorFormValues,
): CreateNodePayload => ({
  title: values.title.trim(),
  slug: values.slug.trim(),
  prompt: normalizeOptionalText(values.prompt),
  answer_summary: normalizeOptionalText(values.answer_summary),
  evidence_excerpt: normalizeOptionalText(values.evidence_excerpt),
  evidence_source: normalizeOptionalText(values.evidence_source),
  parent_id: parseParentId(values.parent_id),
  display_order: values.display_order,
  is_active: values.is_active,
});

const buildUpdatePayload = (
  values: NodeEditorFormValues,
): UpdateNodePayload => ({
  title: values.title.trim(),
  slug: values.slug.trim(),
  prompt: normalizeOptionalText(values.prompt),
  answer_summary: normalizeOptionalText(values.answer_summary),
  evidence_excerpt: normalizeOptionalText(values.evidence_excerpt),
  evidence_source: normalizeOptionalText(values.evidence_source),
  display_order: values.display_order,
  is_active: values.is_active,
});

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
  const previousParentNodeIdRef = useRef<number | null>(parentNodeId);

  const nodeDetailsQuery = useQuery({
    queryKey: ["admin", "nodes", "editor", nodeId],
    queryFn: () => nodesApi.getById(nodeId as number),
    enabled: isEditMode,
  });

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
  } = useForm<NodeEditorFormValues>({
    resolver: zodResolver(nodeEditorSchema),
    mode: "onChange",
    defaultValues: initialCreateValues,
  });

  const watchedTitle = useWatch({
    control,
    name: "title",
  });
  const watchedParentId = useWatch({
    control,
    name: "parent_id",
  });

  const selectedParentId = parseParentId(watchedParentId ?? ROOT_PARENT_VALUE);
  const selectedParent = useMemo(() => {
    if (selectedParentId === null) {
      return null;
    }

    return nodes.find(node => node.id === selectedParentId) ?? parentNode ?? null;
  }, [nodes, parentNode, selectedParentId]);

  const isBusy = isNodesLoading || nodeDetailsQuery.isFetching;

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

    setValue(
      "display_order",
      getSuggestedDisplayOrder(nodes, selectedParentId),
      {
        shouldDirty: false,
        shouldTouch: false,
      },
    );
  }, [
    dirtyFields.display_order,
    isEditMode,
    nodes,
    selectedParentId,
    setValue,
  ]);

  useEffect(() => {
    if (!isEditMode || !nodeDetailsQuery.data) {
      return;
    }

    reset(toFormValues(nodeDetailsQuery.data));
  }, [isEditMode, nodeDetailsQuery.data, reset]);

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

    if (onCancel) {
      onCancel();
      return;
    }

    if (isEditMode && nodeDetailsQuery.data) {
      reset(toFormValues(nodeDetailsQuery.data));
      return;
    }

    reset(initialCreateValues);
  };

  const onSubmit: SubmitHandler<NodeEditorFormValues> = async values => {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      if (isEditMode && nodeId) {
        await updateNode(nodeId, buildUpdatePayload(values));
        reset(values);
        setSuccessMessage("No atualizado com sucesso.");
      } else {
        await createNode(buildCreatePayload(values));
        const nextValues = buildCreateDefaults(nodes, parseParentId(values.parent_id));
        reset(nextValues);
        setSuccessMessage("No criado com sucesso.");
      }

      onSuccess?.();
    } catch (error) {
      setSubmitError(
        getErrorMessage(
          error,
          isEditMode
            ? "Nao foi possivel atualizar o no."
            : "Nao foi possivel criar o no.",
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
        message={getErrorMessage(nodesError, "Tente novamente em instantes.")}
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
        message={getErrorMessage(
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
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditMode ? "Editar no" : "Criar no"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? "Atualize conteudo, ordem e status sem perder a consistencia da arvore."
              : selectedParent
                ? `Novo filho de ${selectedParent.title}.`
                : "Cadastre um novo no raiz ou organize um novo ramo da arvore."}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {selectedParent
            ? `Pai selecionado: ${selectedParent.title}`
            : "Este no sera criado na raiz do chatbot."}
        </div>
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
              placeholder="Ex.: Aproveitamento de estudos"
              aria-invalid={Boolean(errors.title)}
              disabled={isBusy}
              {...register("title")}
            />
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nome exibido para o administrador e nas opcoes do chatbot.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="node-slug">Slug</Label>
            <Input
              id="node-slug"
              type="text"
              placeholder="aproveitamento-de-estudos"
              aria-invalid={Boolean(errors.slug)}
              disabled={isBusy}
              {...register("slug")}
            />
            {errors.slug ? (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Identificador unico usado no fluxo de navegacao e nos logs.
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
              <p className="text-xs text-muted-foreground">
                O no pai nao pode ser alterado na edicao para preservar a
                hierarquia.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="node-parent">No pai</Label>
              <select
                id="node-parent"
                aria-invalid={Boolean(errors.parent_id)}
                disabled={isBusy}
                className={cn(
                  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
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
              ) : (
                <p className="text-xs text-muted-foreground">
                  Escolha um no existente para criar um filho ou mantenha na
                  raiz.
                </p>
              )}
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
            ) : (
              <p className="text-xs text-muted-foreground">
                Controla a ordem do no entre os irmaos no mesmo nivel.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="node-prompt">Prompt</Label>
          <textarea
            id="node-prompt"
            rows={4}
            placeholder="Pergunta ou instrucao exibida quando o usuario entrar neste no."
            aria-invalid={Boolean(errors.prompt)}
            disabled={isBusy}
            className={cn(
              "min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
              errors.prompt && "border-destructive",
            )}
            {...register("prompt")}
          />
          {errors.prompt ? (
            <p className="text-xs text-destructive">{errors.prompt.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Use este campo para menus e submenus. Pelo menos prompt ou resumo
              deve ser preenchido.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="node-answer-summary">Resumo da resposta</Label>
          <textarea
            id="node-answer-summary"
            rows={5}
            placeholder="Resposta objetiva exibida quando o usuario chegar a um no final."
            aria-invalid={Boolean(errors.answer_summary)}
            disabled={isBusy}
            className={cn(
              "min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
              errors.answer_summary && "border-destructive",
            )}
            {...register("answer_summary")}
          />
          {errors.answer_summary ? (
            <p className="text-xs text-destructive">
              {errors.answer_summary.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Use este campo para nos folha com a resposta final do chatbot.
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="node-evidence-excerpt">Trecho da evidencia</Label>
            <textarea
              id="node-evidence-excerpt"
              rows={5}
              placeholder="Cole aqui o trecho do documento oficial que sustenta a resposta."
              aria-invalid={Boolean(errors.evidence_excerpt)}
              disabled={isBusy}
              className={cn(
                "min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
                errors.evidence_excerpt && "border-destructive",
              )}
              {...register("evidence_excerpt")}
            />
            {errors.evidence_excerpt ? (
              <p className="text-xs text-destructive">
                {errors.evidence_excerpt.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Se informar evidencia, a fonte correspondente tambem deve ser
                preenchida.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="node-evidence-source">Fonte da evidencia</Label>
            <Input
              id="node-evidence-source"
              type="text"
              placeholder="Ex.: Regulamento Geral das Fatecs, art. 76"
              aria-invalid={Boolean(errors.evidence_source)}
              disabled={isBusy}
              {...register("evidence_source")}
            />
            {errors.evidence_source ? (
              <p className="text-xs text-destructive">
                {errors.evidence_source.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Identifique de onde o trecho foi extraido para manter a
                rastreabilidade.
              </p>
            )}
          </div>
        </div>

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
              Desative temporariamente para esconder o no do fluxo publico sem
              remover o conteudo.
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
            {isBusy ? (
              "Salvando..."
            ) : isEditMode ? (
              "Salvar alteracoes"
            ) : (
              "Criar no"
            )}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default NodeEditor;
