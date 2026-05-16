import { QuestionsService } from "./questions.service";
import { CreateQuestionDTO, QuestionResponseDTO } from "./questions.types";
import { Request, Response, NextFunction } from "express";

export class QuestionsController {
  async createQuestion(
    request: Request<
      {},
      any,
      {
        requester_name: string;
        question: string;
        requester_email: string;
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
}