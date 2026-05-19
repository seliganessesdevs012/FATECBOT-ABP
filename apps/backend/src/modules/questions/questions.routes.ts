import { QuestionsController } from "./questions.controller";
import { NextFunction, Request, Response, Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import {z } from "zod";

const router: Router = Router();
const controller = new QuestionsController();

const createQuestionSchema = z.object({
    requester_name: z.string().min(1),
    requester_email: z.string().email(),
    session_log_id: z.number().int().positive().optional(),
    question: z.string().min(1),
    attachment_name: z.string().min(1).optional(),
    attachment_mime_type: z.string().min(1).optional(),
    attachment_data: z.string().min(1).optional(),
});

const listQuestionsQuerySchema = z.object({
  status: z.enum(["ABERTA", "RESPONDIDA"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

const updateStatusSchema = z.object({
  status: z.literal("RESPONDIDA"),
});

function validateCreateQuestion(req: Request, _res: Response, next: NextFunction) {
    try {
        req.body = createQuestionSchema.parse(req.body);
        next();
    } catch (error) {
        next(error); 
    }};

function validateListQuestionsQuery(req: Request, _res: Response, next: NextFunction) {
    try {
        req.query = listQuestionsQuerySchema.parse(req.query);
        next();
    } catch (error) {
        next(error);
    }
}



function validateUpdateStatus(req: Request, _res: Response, next: NextFunction) {
    try {
        req.body = updateStatusSchema.parse(req.body);
        next();
    } catch (error) {
        next(error);
    }
}


   router.post("/", validateCreateQuestion, (req, res, next) => controller.createQuestion(req, res, next));

router.get(
  "/",
  authenticate,
  authorize("SECRETARIA", "ADMIN"),
  validateListQuestionsQuery,
  (req, res, next) => controller.listQuestions(req, res, next),
);

router.patch(
  "/:id",
  authenticate,
  authorize("SECRETARIA", "ADMIN"),
  validateUpdateStatus,
  (req, res, next) => controller.updateStatus(req, res, next),
);
    export default router;
