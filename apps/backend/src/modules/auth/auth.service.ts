import { AppError } from "../../errors/AppError";
import { db } from "../../config/database";
import { comparePassword, hashPassword } from "../../utils/hash.util";
import { generateToken } from "../../utils/jwt.utils";
import { ChangePasswordDTO, LoginDTO, LoginResponse } from "./auth.types";

export async function login(dto: LoginDTO): Promise<LoginResponse> {
  const user = await db.user.findUnique({
    where: { email: dto.email },
  });
  if (!user) {
    throw new AppError("E-mail ou senha inválidos", 401);
  }

  const isPasswordValid = await comparePassword(
    dto.password,
    user.password_hash,
  );

  if (!isPasswordValid) {
    throw new AppError("E-mail ou senha inválidos", 401);
  }

  const token = generateToken({ sub: user.id.toString(), role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function changePassword(
  userId: number,
  dto: ChangePasswordDTO,
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password_hash: true,
    },
  });

  if (!user) {
    throw new AppError("Usuario nao encontrado", 404);
  }

  const isCurrentPasswordValid = await comparePassword(
    dto.currentPassword,
    user.password_hash,
  );

  if (!isCurrentPasswordValid) {
    throw new AppError("Senha atual invalida", 401);
  }

  const passwordHash = await hashPassword(dto.newPassword);

  await db.user.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
    },
  });
}
