import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.literal("SECRETARIA"),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;

export interface UserResponseDTO {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "SECRETARIA";
  created_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface UsersListResponseDTO {
  data: UserResponseDTO[];
  meta: PaginationMeta;
}
