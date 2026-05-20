import { api } from "@/lib/axios";
import { env } from "@/config/env";
import type { ApiResponse } from "@/types/api.types";
import type { ChatNode } from "@/features/chatbot/types/chatbot.types";
import { mockBackend } from "@/mocks/dev/mockBackend";

export interface NodeListItemDTO {
  id: number;
  title: string;
  slug: string;
  parent_id: number | null;
  display_order: number;
  is_active: boolean;
  childrenCount: number;
}

export interface CreateNodePayload {
  title: string;
  slug: string;
  prompt: string | null;
  answer_summary: string | null;
  evidence_excerpt: string | null;
  evidence_source: string | null;
  parent_id: number | null;
  display_order: number;
  is_active?: boolean;
}

export interface UpdateNodePayload {
  title?: string;
  slug?: string;
  prompt?: string | null;
  answer_summary?: string | null;
  evidence_excerpt?: string | null;
  evidence_source?: string | null;
  parent_id?: number | null;
  display_order?: number;
  is_active?: boolean;
}

type NodeListResponse = ApiResponse<NodeListItemDTO[]>;
type NodeResponse = ApiResponse<NodeListItemDTO>;
type ChatNodeResponse = ApiResponse<ChatNode>;

export const nodesApi = {
  list: async (): Promise<NodeListItemDTO[]> => {
    if (env.VITE_USE_MOCKS === "true") {
      const response = await mockBackend.nodes.list();
      return response.data;
    }

    const response = await api.get<NodeListResponse>("/nodes");
    return response.data.data;
  },
  getById: async (id: number): Promise<ChatNode> => {
    if (env.VITE_USE_MOCKS === "true") {
      const response = await mockBackend.nodes.getById(id);
      return response.data;
    }

    const response = await api.get<ChatNodeResponse>(`/nodes/${id}`);
    return response.data.data;
  },
  create: async (payload: CreateNodePayload): Promise<NodeListItemDTO> => {
    if (env.VITE_USE_MOCKS === "true") {
      const response = await mockBackend.nodes.create(payload);
      return response.data;
    }

    const response = await api.post<NodeResponse>("/nodes", payload);
    return response.data.data;
  },
  update: async (
    id: number,
    payload: UpdateNodePayload,
  ): Promise<NodeListItemDTO> => {
    if (env.VITE_USE_MOCKS === "true") {
      const response = await mockBackend.nodes.update(id, payload);
      return response.data;
    }

    const response = await api.patch<NodeResponse>(`/nodes/${id}`, payload);
    return response.data.data;
  },
  remove: async (id: number): Promise<void> => {
    if (env.VITE_USE_MOCKS === "true") {
      await mockBackend.nodes.remove(id);
      return;
    }

    await api.delete(`/nodes/${id}`);
  },
};
