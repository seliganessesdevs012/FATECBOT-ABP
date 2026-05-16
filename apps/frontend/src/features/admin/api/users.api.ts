import { api } from "@/lib/axios";
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
    const response = await api.get<UsersListResponse>("/users", { params });
    return response.data;
  },
  create: async (payload: CreateUserPayload): Promise<AdminUser> => {
    const response = await api.post<CreateUserResponse>("/users", payload);
    return response.data.data;
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
