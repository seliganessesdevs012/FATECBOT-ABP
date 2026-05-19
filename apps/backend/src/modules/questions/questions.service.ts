import { CreateQuestionDTO,QuestionResponseDTO, UpdateQuestionStatusDTO } from "./questions.types";
import { db } from "../../config/database";
import { AppError } from "../../errors/AppError";

export class QuestionsService {
    async createQuestion(dto: CreateQuestionDTO): Promise<QuestionResponseDTO> {
        const data: any = {
            requester_name: dto.requester_name,
            question: dto.question,
            requester_email: dto.requester_email,
            attachment_name: dto.attachment_name || null,
            attachment_mime_type: dto.attachment_mime_type || null,
            attachment_data: dto.attachment_data || null,
            status: "ABERTA",
        };
        // create the question first
        let question = await db.question.create({ data });

        // if a session_log_id was provided, set the FK explicitly
        if (dto.session_log_id != null) {
            // verify session log exists
            const session = await db.sessionLog.findUnique({ where: { id: dto.session_log_id } });
            if (!session) {
                throw new AppError("session_log_id not found", 400);
            }

            await db.question.update({
                where: { id: question.id },
                data: { session_log_id: dto.session_log_id },
            });

            // reload question to get updated session_log_id
            const reloaded = await db.question.findUnique({ where: { id: question.id } });
            if (reloaded) question = reloaded;
        }

        return {
            id: question.id,
            requester_name: question.requester_name,
            question: question.question,
            requester_email: question.requester_email,
            session_log_id: question.session_log_id ?? null,
            status: question.status,
            created_at: question.created_at.toISOString(),
            updated_at: question.updated_at.toISOString(),
        };
    }

    async listQuestions(): Promise<void> {
        throw new AppError("Not implemented", 501);
    }

    async updateStatus(): Promise<void> {
        throw new AppError("Not implemented", 501);
    }
}
