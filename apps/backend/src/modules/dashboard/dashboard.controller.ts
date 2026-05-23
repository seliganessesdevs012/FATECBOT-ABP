import type { NextFunction, Request, Response } from "express";
import { DashboardService } from "./dashboard.service";

export class DashboardController {
  async getMetrics(
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const dashboardService = new DashboardService();
      const metrics = await dashboardService.getMetrics();

      response.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}
