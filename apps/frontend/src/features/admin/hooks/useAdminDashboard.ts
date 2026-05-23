import { useQuery } from "@tanstack/react-query";

import {
  dashboardApi,
  type AdminDashboardStats,
} from "@/features/admin/api/dashboard.api";

export interface UseAdminDashboardResult {
  stats: AdminDashboardStats;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}

const DASHBOARD_QUERY_KEY = ["admin", "dashboard", "metrics"] as const;

export function useAdminDashboard(): UseAdminDashboardResult {
  const dashboardQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: () => dashboardApi.getMetrics(),
  });

  const stats: AdminDashboardStats = dashboardQuery.data ?? {
    unansweredTickets: 0,
    positiveRateLast7Days: 0,
    positiveRateAllTime: 0,
    averageClicks: 0,
    recentSessionsAnalyzed: 0,
    totalSessions: 0,
    clickDistribution: Array.from({ length: 8 }, (_, index) => ({
      clicks: index + 1,
      sessions: 0,
      percentage: 0,
    })),
  };

  const refetch = async (): Promise<unknown> => dashboardQuery.refetch();

  return {
    stats,
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    error: dashboardQuery.error,
    refetch,
  };
}
