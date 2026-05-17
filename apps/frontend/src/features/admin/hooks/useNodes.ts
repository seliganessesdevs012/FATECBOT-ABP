import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  nodesApi,
  type CreateNodePayload,
  type NodeListItemDTO,
} from "@/features/admin/api/nodes.api";

export function useNodes(): {
  nodes: NodeListItemDTO[];
  isLoading: boolean;
  createNode: (dto: CreateNodePayload) => Promise<void>;
  updateNode: (id: number, dto: Partial<CreateNodePayload>) => Promise<void>;
  deleteNode: (id: number) => Promise<void>;
} {
  const queryClient = useQueryClient();

  const { data: nodes, isLoading: isQueryLoading } = useQuery({
    queryKey: ["nodes"],
    queryFn: nodesApi.list,
  });

  const createNodeMutation = useMutation({
    mutationFn: (dto: CreateNodePayload) => nodesApi.create(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: Partial<CreateNodePayload>;
    }) => nodesApi.update(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: (id: number) => nodesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });

  const createNode = async (dto: CreateNodePayload): Promise<void> => {
    await createNodeMutation.mutateAsync(dto);
  };

  const updateNode = async (
    id: number,
    dto: Partial<CreateNodePayload>,
  ): Promise<void> => {
    await updateNodeMutation.mutateAsync({ id, dto });
  };

  const deleteNode = async (id: number): Promise<void> => {
    await deleteNodeMutation.mutateAsync(id);
  };

  const isLoading =
    isQueryLoading ||
    createNodeMutation.isPending ||
    updateNodeMutation.isPending ||
    deleteNodeMutation.isPending;

  return {
    nodes: nodes ?? [],
    isLoading,
    createNode,
    updateNode,
    deleteNode,
  };
}
