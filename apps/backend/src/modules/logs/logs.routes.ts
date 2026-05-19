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
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});



function validateLogsQuery(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    req.query = logsQuerySchema.parse(req.query);
    next();
  } catch (error) {
    next(error);
  }
}
router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", validateLogsQuery, (req, res, next) => controller.getLogs(req, res, next));

export default router;