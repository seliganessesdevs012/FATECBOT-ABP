import { api } from "@/lib/axios";
import { env } from "@/config/env";
import { mockBackend } from "@/mocks/dev/mockBackend";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Role } from "@/types/common.types";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: "SECRETARIA";
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
}

export type UsersListResponse = PaginatedResponse<AdminUser>;

type CreateUserResponse = ApiResponse<AdminUser>;

export const usersApi = {
  list: async (params: ListUsersParams = {}): Promise<UsersListResponse> => {
    if (env.VITE_USE_MOCKS === "true") {
      return mockBackend.users.list(params);
    }

    const response = await api.get<UsersListResponse>("/users", { params });
    return response.data;
  },
  create: async (payload: CreateUserPayload): Promise<AdminUser> => {
    if (env.VITE_USE_MOCKS === "true") {
      const response = await mockBackend.users.create(payload);
      return response.data;
    }

    const response = await api.post<CreateUserResponse>("/users", payload);
    return response.data.data;
  },
  remove: async (id: number): Promise<void> => {
    if (env.VITE_USE_MOCKS === "true") {
      await mockBackend.users.remove(id);
      return;
    }

    await api.delete(`/users/${id}`);
  },
};
