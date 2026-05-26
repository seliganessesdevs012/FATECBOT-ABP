import { LogFiltersDTO, PaginatedLogsResponseDTO, SessionLogResponseDTO } from "./logs.types";
import { db } from "../../config/database";
import { AppError } from "../../errors/AppError";
import { paginate } from "../../utils/pagination.utils";

export class LogsService {
    async getLogs(filters: LogFiltersDTO): Promise<PaginatedLogsResponseDTO> {
        const { flag, from, to, page = 1, limit = 20 } = filters;

        // Validar se os filtros de data são válidos
        if (from && isNaN(Date.parse(from))) {
            throw new AppError("O parâmetro 'from' não é uma data válida", 400);
        }
        if (to && isNaN(Date.parse(to))) {
            throw new AppError("O parâmetro 'to' não é uma data válida", 400);
        }

        const { skip, take } = paginate({ page, limit });

        const where: any = {};
        if (flag) {
            where.flag = flag;
        }
        if (from || to) {
            where.created_at = {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
            };
        }

        try {
            const [logs, total] = await db.$transaction([
                db.sessionLog.findMany({
                    where,
                    orderBy: { created_at: "desc" },
                    skip,
                    take,
                    include: {
                        questions: {
                            select: {
                                id: true,
                                question: true,
                                status: true,
                            },
                        },
                    },
                }),
                db.sessionLog.count({ where }),
            ]);

            const data: SessionLogResponseDTO[] = logs.map((log) => {
                const navigationFlow = Array.isArray(log.navigation_flow)
                    ? (log.navigation_flow as string[])
                    : [];

                return {
                    id: log.id,
                    navigation_flow: navigationFlow,
                    flag: log.flag,
                    created_at: log.created_at.toISOString(),
                    questions: log.questions.map((q) => ({
                        id: q.id,
                        question: q.question,
                        status: q.status,
                    })),
                };
            });

            return {
                data,
                meta: {
                    total,
                    page,
                    limit,
                },
            };
        } catch (error) {
            throw new AppError("Erro ao buscar logs no banco de dados", 500);
        }
    }
}



