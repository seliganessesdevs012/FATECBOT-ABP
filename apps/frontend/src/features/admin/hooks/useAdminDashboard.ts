import { useQuery } from "@tanstack/react-query";

import { useLogs } from "@/features/admin/hooks/useLogs";
import { questionsApi } from "@/features/secretary/api/questions.api";

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

export interface UseAdminDashboardResult {
  stats: AdminDashboardStats;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}

const OPEN_TICKETS_QUERY_KEY = [
  "admin",
  "dashboard",
  "unanswered-tickets",
] as const;

const CHART_LIMIT = 200;

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);

  return toDateOnly(date);
};

const toClicksCount = (navigationFlow: string[]): number =>
  Math.min(8, Math.max(1, navigationFlow.length - 1));

const buildClickDistribution = (
  flows: { navigation_flow: string[] }[],
): ClickDistributionPoint[] => {
  const total = flows.length;

  return Array.from({ length: 8 }, (_, index) => {
    const clicks = index + 1;
    const sessions = flows.filter(
      flow => toClicksCount(flow.navigation_flow) === clicks,
    ).length;

    return {
      clicks,
      sessions,
      percentage: total === 0 ? 0 : Math.round((sessions / total) * 100),
    };
  });
};

const calculateRate = (positiveTotal: number, total: number): number => {
  if (total === 0) {
    return 0;
  }

  return Math.round((positiveTotal / total) * 100);
};

export function useAdminDashboard(): UseAdminDashboardResult {
  const openTicketsQuery = useQuery({
    queryKey: OPEN_TICKETS_QUERY_KEY,
    queryFn: () =>
      questionsApi.list({
        status: "ABERTA",
        page: 1,
        limit: 1,
      }),
  });

  const chartLogsQuery = useLogs({
    page: 1,
    limit: CHART_LIMIT,
  });
  const allLogsQuery = useLogs({ page: 1, limit: 1 });
  const allPositiveLogsQuery = useLogs({
    flag: "ATENDEU",
    page: 1,
    limit: 1,
  });
  const recentLogsQuery = useLogs({
    from: getDateDaysAgo(6),
    page: 1,
    limit: 1,
  });
  const recentPositiveLogsQuery = useLogs({
    flag: "ATENDEU",
    from: getDateDaysAgo(6),
    page: 1,
    limit: 1,
  });

  const clickDistribution = buildClickDistribution(chartLogsQuery.logs);
  const recentSessionsAnalyzed = chartLogsQuery.logs.length;
  const averageClicks =
    recentSessionsAnalyzed === 0
      ? 0
      : Number(
          (
            chartLogsQuery.logs.reduce(
              (total, log) => total + toClicksCount(log.navigation_flow),
              0,
            ) / recentSessionsAnalyzed
          ).toFixed(1),
        );

  const stats: AdminDashboardStats = {
    unansweredTickets: openTicketsQuery.data?.meta.total ?? 0,
    positiveRateLast7Days: calculateRate(
      recentPositiveLogsQuery.meta.total,
      recentLogsQuery.meta.total,
    ),
    positiveRateAllTime: calculateRate(
      allPositiveLogsQuery.meta.total,
      allLogsQuery.meta.total,
    ),
    averageClicks,
    recentSessionsAnalyzed,
    totalSessions: allLogsQuery.meta.total,
    clickDistribution,
  };

  const isLoading =
    openTicketsQuery.isLoading ||
    chartLogsQuery.isLoading ||
    allLogsQuery.isLoading ||
    allPositiveLogsQuery.isLoading ||
    recentLogsQuery.isLoading ||
    recentPositiveLogsQuery.isLoading;
  const isError =
    openTicketsQuery.isError ||
    chartLogsQuery.isError ||
    allLogsQuery.isError ||
    allPositiveLogsQuery.isError ||
    recentLogsQuery.isError ||
    recentPositiveLogsQuery.isError;
  const error =
    openTicketsQuery.error ??
    chartLogsQuery.error ??
    allLogsQuery.error ??
    allPositiveLogsQuery.error ??
    recentLogsQuery.error ??
    recentPositiveLogsQuery.error;

  const refetch = async (): Promise<unknown> =>
    Promise.all([
      openTicketsQuery.refetch(),
      chartLogsQuery.refetch(),
      allLogsQuery.refetch(),
      allPositiveLogsQuery.refetch(),
      recentLogsQuery.refetch(),
      recentPositiveLogsQuery.refetch(),
    ]);

  return {
    stats,
    isLoading,
    isError,
    error,
    refetch,
  };
}
