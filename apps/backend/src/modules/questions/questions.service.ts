import { db } from "../../config/database";
import { AppError } from "../../errors/AppError";
import { paginate } from "../../utils/pagination.utils";
import {
  removeQuestionAttachment,
  resolveQuestionAttachmentPath,
  saveQuestionAttachment,
} from "./questions.attachments";
import {
  type CreateQuestionDTO,
  type QuestionResponseDTO,
  type UpdateQuestionStatusDTO,
} from "./questions.types";

const toQuestionResponse = (question: {
  id: number;
  requester_name: string;
  question: string;
  requester_email: string;
  session_log_id: number | null;
  attachment_name: string | null;
  attachment_mime_type: string | null;
  attachment_size_bytes: number | null;
  attachment_storage_key?: string | null;
  attachment_data?: Uint8Array | Buffer | null;
  status: "ABERTA" | "RESPONDIDA";
  answered_at: Date | null;
  answered_by_user: {
    id: number;
    name: string;
    email: string;
    role: "ADMIN" | "SECRETARIA";
  } | null;
  created_at: Date;
  updated_at: Date;
}): QuestionResponseDTO => ({
  id: question.id,
  requester_name: question.requester_name,
  question: question.question,
  requester_email: question.requester_email,
  session_log_id: question.session_log_id ?? null,
  attachment_name: question.attachment_name ?? null,
  attachment_mime_type: question.attachment_mime_type ?? null,
  attachment_size_bytes: question.attachment_size_bytes ?? null,
  has_attachment:
    Boolean(question.attachment_storage_key) || Boolean(question.attachment_data),
  status: question.status,
  answered_at: question.answered_at?.toISOString() ?? null,
  answered_by_user: question.answered_by_user
    ? {
        id: question.answered_by_user.id,
        name: question.answered_by_user.name,
        email: question.answered_by_user.email,
        role: question.answered_by_user.role,
      }
    : null,
  created_at: question.created_at.toISOString(),
  updated_at: question.updated_at.toISOString(),
});

export class QuestionsService {
  async createQuestion(dto: CreateQuestionDTO): Promise<QuestionResponseDTO> {
    if (dto.session_log_id != null) {
      const session = await db.sessionLog.findUnique({
        where: { id: dto.session_log_id },
        select: { id: true },
      });

      if (!session) {
        throw new AppError("session_log_id not found", 400);
      }
    }

    const createdQuestion = await db.question.create({
      data: {
        requester_name: dto.requester_name,
        question: dto.question,
        requester_email: dto.requester_email,
        session_log_id: dto.session_log_id ?? null,
        attachment_name: dto.attachment_name ?? null,
        attachment_mime_type: dto.attachment_mime_type ?? null,
        status: "ABERTA",
      },
      include: {
        answered_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    let storageKeyToCleanup: string | null = null;

    try {
      if (
        dto.attachment_name &&
        dto.attachment_mime_type &&
        dto.attachment_data
      ) {
        const savedAttachment = await saveQuestionAttachment({
          questionId: createdQuestion.id,
          fileName: dto.attachment_name,
          mimeType: dto.attachment_mime_type,
          fileData: dto.attachment_data,
        });

        storageKeyToCleanup = savedAttachment.storageKey;

        const updatedQuestion = await db.question.update({
          where: { id: createdQuestion.id },
          data: {
            attachment_storage_key: savedAttachment.storageKey,
            attachment_size_bytes: savedAttachment.sizeBytes,
            attachment_data: null,
          },
          include: {
            answered_by_user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        });

        return toQuestionResponse(updatedQuestion);
      }

      return toQuestionResponse({
        ...createdQuestion,
        attachment_size_bytes: null,
        attachment_storage_key: null,
        attachment_data: null,
      });
    } catch (error) {
      await db.question.delete({ where: { id: createdQuestion.id } }).catch(() => {});
      await removeQuestionAttachment(storageKeyToCleanup).catch(() => {});
      throw error;
    }
  }

  async listQuestions(query: {
    status?: "ABERTA" | "RESPONDIDA";
    page?: string | number;
    limit?: string | number;
  }): Promise<{
    data: QuestionResponseDTO[];
    meta: { total: number; page: number; limit: number };
  }> {
    const { skip, take, page, limit } = paginate(query);

    const where = query.status ? { status: query.status } : {};
    const [total, questions] = await Promise.all([
      db.question.count({ where }),
      db.question.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          answered_by_user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      data: questions.map(toQuestionResponse),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async updateStatus(
    id: number,
    dto: UpdateQuestionStatusDTO,
  ): Promise<QuestionResponseDTO> {
    if (dto.status !== "RESPONDIDA") {
      throw new AppError("Status invalido para atualizacao", 400);
    }

    const question = await db.question.findUnique({
      where: { id },
      include: {
        answered_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!question) {
      throw new AppError("Pergunta nao encontrada", 404);
    }

    if (question.status === "RESPONDIDA") {
      return toQuestionResponse(question);
    }

    if (!dto.answered_by_user_id) {
      throw new AppError(
        "Nao foi possivel identificar quem marcou a pergunta como respondida.",
        400,
      );
    }

    const responder = await db.user.findUnique({
      where: { id: dto.answered_by_user_id },
      select: { id: true },
    });

    if (!responder) {
      throw new AppError("Usuario responsavel nao encontrado.", 404);
    }

    const updatedQuestion = await db.question.update({
      where: { id },
      data: {
        status: dto.status,
        answered_by_user_id: dto.answered_by_user_id,
        answered_at: new Date(),
      },
      include: {
        answered_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return toQuestionResponse(updatedQuestion);
  }

  async getAttachment(id: number): Promise<{
    fileName: string;
    mimeType: string;
    filePath?: string;
    fileBuffer?: Buffer;
  }> {
    const question = await db.question.findUnique({
      where: { id },
      select: {
        attachment_name: true,
        attachment_mime_type: true,
        attachment_storage_key: true,
        attachment_data: true,
      },
    });

    if (!question || !question.attachment_name || !question.attachment_mime_type) {
      throw new AppError("Esta pergunta nao possui anexo salvo.", 404);
    }

    if (question.attachment_storage_key) {
      const filePath = await resolveQuestionAttachmentPath(
        question.attachment_storage_key,
      );

      if (!filePath) {
        throw new AppError("O anexo salvo nao foi encontrado no storage.", 404);
      }

      return {
        fileName: question.attachment_name,
        mimeType: question.attachment_mime_type,
        filePath,
      };
    }

    if (question.attachment_data) {
      return {
        fileName: question.attachment_name,
        mimeType: question.attachment_mime_type,
        fileBuffer: Buffer.from(question.attachment_data),
      };
    }

    throw new AppError("Esta pergunta nao possui anexo salvo.", 404);
  }
}
