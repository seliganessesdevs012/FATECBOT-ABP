import { Request, Response, NextFunction } from "express";
import { AppError } from "../../errors/AppError";
import { changePassword, login } from "./auth.service";
import { ChangePasswordDTO, LoginDTO } from "./auth.types";

export class AuthController {
  async login(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const dto = request.body as LoginDTO;
      const result = await login(dto);
      response.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = Number(request.user?.sub);

      if (!Number.isFinite(userId)) {
        throw new AppError("Usuario autenticado invalido", 401);
      }

      const dto = request.body as ChangePasswordDTO;
      await changePassword(userId, dto);

      response.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}
