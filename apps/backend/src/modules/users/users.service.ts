import { db } from "../../config/database";
import { AppError } from "../../errors/AppError";
import { hashPassword } from "../../utils/hash.util";
import { paginate } from "../../utils/pagination.utils";
import type {
  CreateUserDTO,
  UserResponseDTO,
  UsersListResponseDTO,
} from "./users.types";

export class UsersService {
  async listUsers(query: { page?: unknown; limit?: unknown }): Promise<UsersListResponseDTO> {
    const { skip, take, page, limit } = paginate(query as { page?: unknown; limit?: unknown });

    const [total, users] = await Promise.all([
      db.user.count({ where: { role: "SECRETARIA" } }),
      db.user.findMany({
        where: { role: "SECRETARIA" },
        skip,
        take,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          created_at: true,
        },
      }),
    ]);

    const data: UserResponseDTO[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at.toISOString(),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async createUser(dto: CreateUserDTO): Promise<UserResponseDTO> {
    if (dto.role !== "SECRETARIA") {
      throw new AppError("Role invalida para criacao de usuario", 400);
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await db.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password_hash: passwordHash,
        role: "SECRETARIA",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at.toISOString(),
    };
  }

  async removeUser(id: number): Promise<void> {
    if (!Number.isFinite(id)) {
      throw new AppError("Parametro id invalido", 400);
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new AppError("Usuario nao encontrado", 404);
    }

    if (user.role === "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        throw new AppError("Nao e possivel remover o unico admin", 409);
      }
    }

    await db.user.delete({ where: { id } });
  }
}
