import { CreateQuestionDTO, QuestionResponseDTO, UpdateQuestionStatusDTO } from "./questions.types";
import { db } from "../../config/database";
import { AppError } from "../../errors/AppError";
import { paginate } from "../../utils/pagination.utils";

export class QuestionsService {
    async createQuestion(dto: CreateQuestionDTO): Promise<QuestionResponseDTO> {
        const question = await db.question.create({
            data: {
                requester_name: dto.requester_name,
                question: dto.question,
                requester_email: dto.requester_email,
                attachment_name: dto.attachment_name || null,
                attachment_mime_type: dto.attachment_mime_type || null,
                attachment_data: dto.attachment_data || null,
                status: "ABERTA"
            }
        })
        return {
            id: question.id,
            requester_name: question.requester_name,
            question: question.question,
            requester_email: question.requester_email,
            status: question.status,
            created_at: question.created_at.toISOString(),
            updated_at: question.updated_at.toISOString()
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