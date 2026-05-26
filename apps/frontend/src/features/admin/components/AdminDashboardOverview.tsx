import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAdminDashboard } from "@/features/admin/hooks/useAdminDashboard";

interface AdminDashboardOverviewProps {
  userName: string;
}

interface MetricCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const getFirstName = (name: string): string => name.split(" ")[0] ?? "Usuario";

const getChartTicks = (percentages: number[]): number[] => {
  const highestValue = Math.max(...percentages, 5);
  const maxTick = Math.ceil(highestValue / 5) * 5;

  return Array.from({ length: 5 }, (_, index) =>
    Math.round((maxTick / 5) * (index + 1)),
  );
};

function MetricCard({ title, children, className }: MetricCardProps) {
  return (
    <article
      className={[
        "rounded-[30px] border border-[#E7DECD] bg-white px-5 py-5 shadow-[0_20px_45px_rgba(76,56,24,0.05)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 className="text-center text-[1.05rem] font-black italic leading-tight text-[#1F1F1F]">
        {title}
      </h2>
      {children}
    </article>
  );
}

function ClickDistributionChart({
  points,
}: {
  points: {
    clicks: number;
    sessions: number;
    percentage: number;
  }[];
}) {
  const ticks = getChartTicks(points.map(point => point.percentage));
  const maxTick = ticks.at(-1) ?? 25;

  return (
    <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-3">
      <div className="flex h-44 flex-col justify-between pb-6 text-[0.72rem] font-bold text-[#444444]">
        {[...ticks].reverse().map(tick => (
          <span key={tick}>{tick}%</span>
        ))}
      </div>

      <div className="relative h-44">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[...ticks].reverse().map(tick => (
            <div
              key={tick}
              className="border-t border-[#D1D1D1]"
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="relative z-10 flex h-full items-end justify-between gap-2 pb-6">
          {points.map(point => (
            <div
              key={point.clicks}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <div
                className="w-full max-w-[34px] rounded-t-[10px] bg-[#D9D9D9] transition-all"
                style={{
                  height: `${maxTick === 0 ? 0 : (point.percentage / maxTick) * 100}%`,
                }}
                title={`${point.sessions} sessoes`}
              />
              <span className="text-[0.78rem] font-black text-[#323232]">
                {point.clicks}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SatisfactionDonut({ percentage }: { percentage: number }) {
  const positivePercentage = Math.max(0, Math.min(100, percentage));
  const negativePercentage = 100 - positivePercentage;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-4">
      <div
        className="flex h-40 w-40 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#08B61B 0 ${positivePercentage}%, #C44A23 ${positivePercentage}% 100%)`,
        }}
        aria-label={`${positivePercentage}% de avaliacoes positivas e ${negativePercentage}% negativas`}
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-black text-[#1F1F1F]">
          {positivePercentage}%
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold text-[#635D54]">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#08B61B]" />
          Positivas
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#C44A23]" />
          Negativas
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboardOverview({
  userName,
}: AdminDashboardOverviewProps) {
  const { stats, isLoading, isError, error, refetch } = useAdminDashboard();

  if (isLoading) {
    return <LoadingSpinner message="Carregando metricas do dashboard..." />;
  }

  if (isError) {
    return (
      <ErrorAlert
        title="Erro ao carregar dashboard"
        message={
          error instanceof Error
            ? error.message
            : "Nao foi possivel consolidar os indicadores do painel."
        }
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <header className="px-2 pt-1 text-center">
        <h1 className="text-3xl font-black tracking-tight text-[#111111] lg:text-[2.3rem]">
          Bem vindo, {getFirstName(userName)}!
        </h1>
        <p className="mt-2 text-sm text-[#6E675E]">
          Indicadores consolidados das sessoes do chatbot e da fila de
          atendimento interno.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.9fr)]">
        <MetricCard
          title="Total de tickets nao respondidos"
          className="flex min-h-[220px] flex-col justify-between"
        >
          <div className="flex flex-1 items-center justify-center">
            <span className="text-7xl font-black leading-none text-black">
              {stats.unansweredTickets}
            </span>
          </div>
        </MetricCard>

        <MetricCard title="Cliques medios para obter uma resposta">
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#6E675E]">
              <span>
                Media recente:{" "}
                <strong className="text-[#1F1F1F]">
                  {stats.averageClicks.toFixed(1)} cliques
                </strong>
              </span>
              <span>
                Base:{" "}
                <strong className="text-[#1F1F1F]">
                  {stats.recentSessionsAnalyzed} sessoes
                </strong>
              </span>
            </div>

            {stats.recentSessionsAnalyzed === 0 ? (
              <div className="flex min-h-[176px] items-center justify-center rounded-[22px] bg-[#FBF8F2] px-6 text-center text-sm text-[#7C7468]">
                Ainda nao existem sessoes avaliadas o suficiente para montar a
                distribuicao de cliques.
              </div>
            ) : (
              <ClickDistributionChart points={stats.clickDistribution} />
            )}
          </div>
        </MetricCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
        <MetricCard
          title="% de avaliacoes positivas nos ultimos 7 dias"
          className="flex min-h-[240px] flex-col justify-between"
        >
          <div className="flex flex-1 items-center justify-center">
            <span className="text-[4.6rem] font-black leading-none text-black lg:text-[5.2rem]">
              {stats.positiveRateLast7Days}%
            </span>
          </div>
          <p className="text-center text-sm text-[#6E675E]">
            Janela recente para leitura rapida da satisfacao do atendimento.
          </p>
        </MetricCard>

        <MetricCard title="% de avaliacoes positivas desde o inicio">
          <SatisfactionDonut percentage={stats.positiveRateAllTime} />
          <p className="text-center text-sm text-[#6E675E]">
            {stats.totalSessions} sessoes avaliadas acumuladas no historico.
          </p>
        </MetricCard>
      </div>
    </section>
  );
}
