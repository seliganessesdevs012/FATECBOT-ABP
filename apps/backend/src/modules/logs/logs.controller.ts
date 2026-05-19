import { LogsService } from "./logs.service";
import { Request, Response, NextFunction } from "express";

export class LogsController {
    async getLogs(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { flag, from, to, page, limit } = request.query;
            const filter = {
                flag: flag as "ATENDEU" | "NAO_ATENDEU",
                from: from as string | undefined,
                to: to as string | undefined,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            }
            const logsService = new LogsService();
            const result = await logsService.getLogs(filter);

           response.status(200).json({
  success: true,
  data: result.data,
  meta: result.meta,
});;

        } catch (error) {
            next(error);
        }
    }
}