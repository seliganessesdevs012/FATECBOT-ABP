import { Router } from "express";
import { NextFunction, Request, Response} from "express";
import { LogsController } from "./logs.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import { z } from "zod";


const router = Router();
const controller = new LogsController();


const logsQuerySchema = z.object({
  flag: z.enum(["ATENDEU", "NAO_ATENDEU"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1), // Define um valor padrão para `page`
  limit: z.coerce.number().int().positive().default(20), // Define um valor padrão para `limit`
});



function validateLogsQuery(req: Request, _res: Response, next: NextFunction) {
  try {
    const validatedQuery = logsQuerySchema.parse(req.query); 
    (req as any).validatedQuery = validatedQuery; 
    next();
  } catch (error) {
    next(error);
  }
}
router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", validateLogsQuery, (req, res, next) => controller.getLogs(req, res, next));

export default router;