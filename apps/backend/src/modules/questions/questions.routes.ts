import { QuestionsController } from "./questions.controller";
import { NextFunction, Request, Response, Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/rbac.middleware";
import { z } from "zod";

const router: Router = Router();
const controller = new QuestionsController();

const isValidBase64 = (value: string): boolean => {
  const normalizedValue = value.trim();

  if (!normalizedValue || normalizedValue.length % 4 !== 0) {
    return false;
  }

  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
    normalizedValue,
  );
};

const createQuestionSchema = z.object({
  requester_name: z
    .string()
    .trim()
    .min(3, "Nome deve ter no minimo 3 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .regex(/[A-Za-zÀ-ÖØ-öø-ÿ]/, "Nome deve conter letras"),
  requester_email: z
    .string()
    .trim()
    .max(50, "E-mail deve ter no máximo 50 caracteres")
    .email("E-mail no formato inválido"),
  session_log_id: z.number().int().positive().optional(),
  question: z
    .string()
    .trim()
    .min(10, "Pergunta deve ter no minimo 10 caracteres")
    .max(2000, "Pergunta deve ter no maximo 2000 caracteres"),
  attachment_name: z.string().trim().min(1).optional(),
  attachment_mime_type: z.string().trim().min(1).optional(),
  attachment_data: z
    .string()
    .trim()
    .min(1)
    .refine(isValidBase64, "Conteudo do anexo deve estar em base64 valido")
    .optional(),
}).superRefine((data, context) => {
  const attachmentFields = [
    data.attachment_name,
    data.attachment_mime_type,
    data.attachment_data,
  ];
  const filledFields = attachmentFields.filter((value) => value != null);

  if (filledFields.length > 0 && filledFields.length < attachmentFields.length) {
    context.addIssue({
      code: "custom",
      path: ["attachment_data"],
      message:
        "Envie nome, tipo e conteudo do anexo juntos ou remova o anexo.",
    });
  }
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
  }
}

function validateListQuestionsQuery(req: Request, _res: Response, next: NextFunction) {
    try {
        (req as any).validatedQuery = listQuestionsQuerySchema.parse(req.query);
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


router.post("/", validateCreateQuestion, (req, res, next) =>
  controller.createQuestion(req, res, next),
);

router.get(
  "/",
  authenticate,
  authorize("SECRETARIA", "ADMIN"),
  validateListQuestionsQuery,
  (req, res, next) => controller.listQuestions(req, res, next),
);

router.get(
  "/:id/attachment",
  authenticate,
  authorize("SECRETARIA", "ADMIN"),
  (req, res, next) => controller.downloadAttachment(req, res, next),
);

router.patch(
  "/:id",
  authenticate,
  authorize("SECRETARIA", "ADMIN"),
  validateUpdateStatus,
  (req, res, next) => controller.updateStatus(req, res, next),
);

export default router;
