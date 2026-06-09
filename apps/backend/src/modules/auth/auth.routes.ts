import { Router, Request, Response, NextFunction } from "express";
import {z} from "zod";
import { AuthController } from "./auth.controller";


const router: Router = Router();
const controller = new AuthController();

const loginSchema = z.object({
  email: z.string().min(3, "Email deve ter no mínimo 3 caracteres").max(50, "Email deve ter no máximo 50 caracteres").email("Formato inválido de email"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(50, "Senha deve ter no máximo 50 caracteres"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Senha atual deve ter no mínimo 6 caracteres").max(50, "Senha atual deve ter no máximo 50 caracteres"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres").max(50, "Nova senha deve ter no máximo 50 caracteres"),
});

function validateLogin(req: Request, _res: Response, next: NextFunction): void {
  try {
    req.body = loginSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
}

router.post("/login", validateLogin, (req, res,next)=> controller.login(req, res, next),);
export default router;