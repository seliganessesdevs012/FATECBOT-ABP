import { QuestionsService } from "./questions.service";
import { CreateQuestionDTO, QuestionResponseDTO } from "./questions.types";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../errors/AppError";

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
        attachment_data?: string | null; // base64 string from frontend
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

  async listQuestions(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const questionsService = new QuestionsService();
      const query = request.query as { status?: "ABERTA" | "RESPONDIDA"; page?: string; limit?: string };
      const result = await questionsService.listQuestions(query);
      response.status(200).json({ success: true, data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const questionsService = new QuestionsService();
      const { id } = request.params;
      const questionID = Number(id);

      if (isNaN(questionID) || questionID <= 0) {
        throw new AppError("Parâmetro de ID inválido", 400);
      }
      const { status } = request.body;

      const question = await questionsService.updateStatus(Number(id), { status });
      response.status(200).json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }
}