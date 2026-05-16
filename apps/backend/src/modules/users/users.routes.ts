import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import { UsersController } from "./users.controller";
import { createUserSchema } from "./users.types";

const router: Router = Router();
const controller = new UsersController();

function validateCreateUser(req: Request, _res: Response, next: NextFunction): void {
  try {
    req.body = createUserSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
}

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", (req, res, next) => controller.listUsers(req, res, next));
router.post("/", validateCreateUser, (req, res, next) =>
  controller.createUser(req, res, next),
);
router.delete("/:id", (req, res, next) => controller.removeUser(req, res, next));

export default router;
