import { db } from "../../config/database";
import type {
  ClickDistributionPointDTO,
  DashboardMetricsDTO,
} from "./dashboard.types";

const CHART_LIMIT = 200;

const clampClicksCount = (navigationFlow: unknown): number => {
  if (!Array.isArray(navigationFlow)) {
    return 1;
  }

  const rawClicks = navigationFlow.length - 1;

  return Math.min(8, Math.max(1, rawClicks));
};

const calculateRate = (positiveTotal: number, total: number): number => {
  if (total === 0) {
    return 0;
  }

  return Math.round((positiveTotal / total) * 100);
};

const buildClickDistribution = (
  navigationFlows: unknown[],
): ClickDistributionPointDTO[] => {
  const total = navigationFlows.length;

  return Array.from({ length: 8 }, (_, index) => {
    const clicks = index + 1;
    const sessions = navigationFlows.filter(
      navigationFlow => clampClicksCount(navigationFlow) === clicks,
    ).length;

    return {
      clicks,
      sessions,
      percentage: total === 0 ? 0 : Math.round((sessions / total) * 100),
    };
  });
};

export class DashboardService {
  async getMetrics(): Promise<DashboardMetricsDTO> {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const [
      unansweredTickets,
      totalSessions,
      positiveSessionsAllTime,
      recentTotalSessions,
      recentPositiveSessions,
      latestLogsForChart,
    ] = await Promise.all([
      db.question.count({
        where: {
          status: "ABERTA",
        },
      }),
      db.sessionLog.count(),
      db.sessionLog.count({
        where: {
          flag: "ATENDEU",
        },
      }),
      db.sessionLog.count({
        where: {
          created_at: {
            gte: startDate,
          },
        },
      }),
      db.sessionLog.count({
        where: {
          flag: "ATENDEU",
          created_at: {
            gte: startDate,
          },
        },
      }),
      db.sessionLog.findMany({
        orderBy: {
          created_at: "desc",
        },
        take: CHART_LIMIT,
        select: {
          navigation_flow: true,
        },
      }),
    ]);

    const navigationFlows = latestLogsForChart.map((log) =>
      Array.isArray(log.navigation_flow) ? (log.navigation_flow as string[]) : [],
    );
    const recentSessionsAnalyzed = navigationFlows.length;
    const clickDistribution = buildClickDistribution(navigationFlows);
    const averageClicks =
      recentSessionsAnalyzed === 0
        ? 0
        : Number(
            (
              navigationFlows.reduce<number>(
                (total, navigationFlow) => total + clampClicksCount(navigationFlow),
                0,
              ) / recentSessionsAnalyzed
            ).toFixed(1),
          );

    return {
      unansweredTickets,
      positiveRateLast7Days: calculateRate(
        recentPositiveSessions,
        recentTotalSessions,
      ),
      positiveRateAllTime: calculateRate(
        positiveSessionsAllTime,
        totalSessions,
      ),
      averageClicks,
      recentSessionsAnalyzed,
      totalSessions,
      clickDistribution,
    };
  }
}
