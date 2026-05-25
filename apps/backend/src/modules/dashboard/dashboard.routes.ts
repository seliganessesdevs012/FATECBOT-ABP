import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import { DashboardController } from "./dashboard.controller";

const router: Router = Router();
const controller = new DashboardController();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/metrics", (request, response, next) =>
  controller.getMetrics(request, response, next),
);

export default router;
