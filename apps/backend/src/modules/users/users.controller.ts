import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import type { CreateUserDTO } from "./users.types";
import { UsersService } from "./users.service";

export class UsersController {
  private readonly usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  async listUsers(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.usersService.listUsers({
        page: request.query.page,
        limit: request.query.limit,
      });

      response.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const dto = request.body as CreateUserDTO;
      const user = await this.usersService.createUser(dto);

      response.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeUser(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(request.params.id);
      if (!Number.isFinite(userId)) {
        throw new AppError("Parametro id invalido", 400);
      }

      await this.usersService.removeUser(userId);

      response.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}
