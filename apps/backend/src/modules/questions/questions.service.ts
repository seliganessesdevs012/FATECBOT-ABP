import { CreateQuestionDTO, QuestionResponseDTO, UpdateQuestionStatusDTO } from "./questions.types";
import { db } from "../../config/database";
import { AppError } from "../../errors/AppError";
import { paginate } from "../../utils/pagination.utils";

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

    async listQuestions(query: { status?: "ABERTA" | "RESPONDIDA"; page?: string | number; limit?: string | number }): Promise<{ data: QuestionResponseDTO[]; meta: { total: number; page: number; limit: number } }> {

        const { skip, take, page, limit } = paginate(query as { page?: unknown; limit?: unknown });

        const where = query.status ? { status: query.status } : {};
        const [total, questions] = await Promise.all([
            db.question.count({ where }),
            db.question.findMany({
                where,
                skip,
                take,
                orderBy: { created_at: "desc" },
                select: {
                    id: true,
                    requester_name: true,
                    question: true,
                    requester_email: true,
                    status: true,
                    created_at: true,
                    updated_at: true,
                },
            }),
        ]);

        const data: QuestionResponseDTO[] = questions.map((question) => ({
            id: question.id,
            requester_name: question.requester_name,
            question: question.question,
            requester_email: question.requester_email,
            status: question.status,
            created_at: question.created_at.toISOString(),
            updated_at: question.updated_at.toISOString(),
        }));

        return {
            data,
            meta: {
                total,
                page,
                limit,
            },
        };

    }

    async updateStatus(id: number, dto: UpdateQuestionStatusDTO): Promise<QuestionResponseDTO> {
        if (dto.status !== "RESPONDIDA") {
  throw new AppError("Status inválido para atualização", 400);
}
const question = await db.question.findUnique({where:{id}});
if (!question) {
    throw new AppError("Pergunta não encontrada", 404);
}
const updatedQuestion = await db.question.update({
    where: { id },
    data: { status: dto.status }
});
return {
    id: updatedQuestion.id,
    requester_name: updatedQuestion.requester_name,
    question: updatedQuestion.question,
    requester_email: updatedQuestion.requester_email,
    status: updatedQuestion.status,
    created_at: updatedQuestion.created_at.toISOString(),
    updated_at: updatedQuestion.updated_at.toISOString()
}
}};