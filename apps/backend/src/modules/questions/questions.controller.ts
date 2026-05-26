import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../errors/AppError";
import {
  type CreateQuestionDTO,
  type QuestionResponseDTO,
} from "./questions.types";
import { QuestionsService } from "./questions.service";

export class QuestionsController {
  async createQuestion(
    request: Request<
      {},
      any,
      {
        requester_name: string;
        question: string;
        requester_email: string;
        session_log_id?: number | null;
        attachment_name?: string | null;
        attachment_mime_type?: string | null;
        attachment_data?: string | null;
      }
    >,
    response: Response<{ success: boolean; data: QuestionResponseDTO }>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const questionsService = new QuestionsService();
      const body = request.body;

      const dto: CreateQuestionDTO = {
        requester_name: body.requester_name,
        question: body.question,
        requester_email: body.requester_email,
        session_log_id: body.session_log_id ?? null,
        attachment_name: body.attachment_name ?? null,
        attachment_mime_type: body.attachment_mime_type ?? null,
        attachment_data: body.attachment_data
          ? new Uint8Array(Buffer.from(body.attachment_data, "base64"))
          : null,
      };

      const question = await questionsService.createQuestion(dto);
      response.status(201).json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }

  async listQuestions(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const questionsService = new QuestionsService();
      const query = ((request as any).validatedQuery ?? request.query) as {
        status?: "ABERTA" | "RESPONDIDA";
        page?: string | number;
        limit?: string | number;
      };
      const result = await questionsService.listQuestions(query);

      response.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const questionsService = new QuestionsService();
      const { id } = request.params;
      const questionId = Number(id);
      const responderId = Number(request.user?.sub);

      if (Number.isNaN(questionId) || questionId <= 0) {
        throw new AppError("Parametro de ID invalido", 400);
      }

      if (Number.isNaN(responderId) || responderId <= 0) {
        throw new AppError(
          "Nao foi possivel identificar o usuario autenticado.",
          401,
        );
      }

      const { status } = request.body;
      const question = await questionsService.updateStatus(questionId, {
        status,
        answered_by_user_id: responderId,
      });

      response.status(200).json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }

  async downloadAttachment(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const questionsService = new QuestionsService();
      const questionId = Number(request.params.id);

      if (Number.isNaN(questionId) || questionId <= 0) {
        throw new AppError("Parametro de ID invalido", 400);
      }

      const attachment = await questionsService.getAttachment(questionId);

      response.setHeader("Content-Type", attachment.mimeType);
      response.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
      );

      if (attachment.filePath) {
        response.sendFile(attachment.filePath);
        return;
      }

      response.status(200).send(attachment.fileBuffer);
    } catch (error) {
      next(error);
    }
  }
}
