export interface ClickDistributionPointDTO {
  clicks: number;
  sessions: number;
  percentage: number;
}

export interface DashboardMetricsDTO {
  unansweredTickets: number;
  positiveRateLast7Days: number;
  positiveRateAllTime: number;
  averageClicks: number;
  recentSessionsAnalyzed: number;
  totalSessions: number;
  clickDistribution: ClickDistributionPointDTO[];
}
