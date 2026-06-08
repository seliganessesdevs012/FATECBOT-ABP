import { api } from "../../../lib/axios";
import { env } from "../../../config/env";
import { mockBackend } from "@/mocks/dev/mockBackend";
import type {
  AuthUser,
  ChangePasswordPayload,
  LoginPayload,
} from "../types/auth.types";

type LoginResponse = {
  success: boolean;
  data: {
    token: string;
    user: AuthUser;
  };
};

export const authApi = {
  login: async (
    payload: LoginPayload,
  ): Promise<{ token: string; user: AuthUser }> => {
    if (env.VITE_USE_MOCKS === "true") {
      return mockBackend.auth.login(payload);
    }

    const response = await api.post<LoginResponse>("/auth/login", payload);

    return response.data.data;
  },
  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    if (env.VITE_USE_MOCKS === "true") {
      await mockBackend.auth.changePassword(payload);
      return;
    }

    await api.patch("/auth/change-password", payload);
  },
};
