import { env } from "@/config/env";
import { api } from "@/lib/axios";
import { mockBackend } from "@/mocks/dev/mockBackend";
import type { ApiResponse } from "@/types/api.types";

export interface ClickDistributionPoint {
  clicks: number;
  sessions: number;
  percentage: number;
}

export interface AdminDashboardStats {
  unansweredTickets: number;
  positiveRateLast7Days: number;
  positiveRateAllTime: number;
  averageClicks: number;
  recentSessionsAnalyzed: number;
  totalSessions: number;
  clickDistribution: ClickDistributionPoint[];
}

export const dashboardApi = {
  async getMetrics(): Promise<AdminDashboardStats> {
    if (env.VITE_USE_MOCKS === "true") {
      return mockBackend.dashboard.getMetrics();
    }

    const response =
      await api.get<ApiResponse<AdminDashboardStats>>("/dashboard/metrics");

    return response.data.data;
  },
};
