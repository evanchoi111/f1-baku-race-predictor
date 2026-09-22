import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ScenarioBanner, ScenarioLab, ScenarioTag, useScenarioLab } from "@/components/scenario-lab";
import { fetchModel, formatScore } from "@/lib/baku-model-client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Baku GP 2026 — Pre-Race Prediction Dashboard" },
      {
        name: "description",
        content:
          "Model-ranked driver predictions for the 2026 Azerbaijan Grand Prix at Baku City Circuit.",
      },
      { property: "og:title", content: "Baku GP 2026 — Pre-Race Prediction Dashboard" },
      {
        property: "og:description",
        content: "Model-ranked driver predictions for the 2026 Azerbaijan Grand Prix at Baku City Circuit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function ScoreRow({
  rank,
  driver,
  team,
  score,
  maxScore,
  isLeader,
  note,
  highlight = false,
}: {
  rank: number;
  driver: string;
  team: string;
  score: number;
  maxScore: number;
  isLeader: boolean;
  note?: string | undefined;
  highlight?: boolean;
}) {
  return (
    <li
      className={`grid grid-cols-[2rem_1fr] items-baseline gap-x-3 py-3 md:grid-cols-[3rem_minmax(11rem,14rem)_1fr_6.5rem] md:gap-x-5 ${
        highlight ? "-mx-3 border-l-4 border-primary bg-card px-3 md:-mx-4 md:px-4" : ""
      }`}
    >
      <span className="font-display text-2xl font-bold tabular-nums text-muted-foreground md:text-3xl">
        {rank}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-xl font-bold uppercase leading-tight md:text-2xl">
          {driver}
        </span>
        <span className="block text-xs uppercase tracking-widest text-muted-foreground md:text-sm">
          {team}
        </span>
        {note && (
          <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-widest text-primary md:text-xs">
            {note}
          </span>
        )}
      </span>
      <span
        className="col-span-2 mt-2 h-2.5 w-full bg-muted md:col-span-1 md:mt-0 md:self-center"
        role="presentation"
      >
        <span
          className={`block h-full ${isLeader ? "bg-primary" : "bg-foreground"}`}
          style={{ width: `${Math.max((score / maxScore) * 100, 1.5)}%` }}
        />
      </span>
      <span className="col-span-2 mt-1 flex flex-col items-start gap-0.5 md:col-span-1 md:mt-0 md:items-end md:self-center">
        <span className="text-base font-semibold tabular-nums md:text-lg">{formatScore(score)}</span>
        <span className="whitespace-nowrap text-[0.65rem] font-normal uppercase tracking-wider text-muted-foreground md:text-xs">
          Model score
        </span>
      </span>
    </li>
  );
}

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">Loading predictions…</p>
      <div className="mt-8 h-40 border-2 border-border" />
      <div className="mt-10 space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="h-8 w-8 bg-muted" />
            <div className="h-8 flex-1 bg-muted" />
            <div className="h-6 w-16 bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Index() {
  const [showAll, setShowAll] = useState(false);
  const { data, error, isPending, isError, refetch, isRefetchError } = useQuery({
    queryKey: ["baku-model"],
    queryFn: fetchModel,
    retry: 1,
    staleTime: 5 * 60_000,
  });
  // Must run before the early returns below so hook order stays stable.
  const lab = useScenarioLab(data);

  if (isPending) {
    return (
      <div className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-2xl border-2 border-destructive bg-card p-8" role="alert">
          <h1 className="font-display text-3xl font-bold uppercase">Predictions unavailable</h1>
          <p className="mt-3 text-foreground/80">
            Could not reach the prediction service
            {error instanceof Error ? `: ${error.message}` : "."} Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 bg-primary px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-racing-dark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { metadata } = data;
  const { scenario, activePredictions: predictions } = lab;
  const isScenario = scenario !== null;
  const leader = predictions[0];
  const maxScore = leader?.win_score ?? 1;
  const topFive = predictions.slice(0, 5);
  const rest = predictions.slice(5);
  const scoreLabel = "Model score";
  const originalRankById = new Map(data.predictions.map((row, index) => [row.driverId, index + 1]));
  const rowNote = (driverId: string, rank: number) => {
    if (!scenario || driverId !== scenario.driverId) return undefined;
    const wasRank = originalRankById.get(driverId);
    return wasRank === undefined || wasRank === rank ? "Scenario driver" : `Scenario driver · was P${wasRank}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-14 md:pb-16 md:pt-20">
          <div className="h-1.5 w-20 bg-primary" aria-hidden="true" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-background/70">
            {metadata.circuit} · Formula 1 {metadata.year}
          </p>
          <h1 className="mt-2 font-display text-8xl font-black uppercase leading-[0.9] tracking-tight md:text-[11rem]">
            Baku
          </h1>
          <p className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide md:text-3xl">
            Pre-race predictions
          </p>
          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4 border-t border-background/20 pt-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-widest text-background/60">Race date</dt>
              <dd className="mt-1 font-display text-lg font-bold uppercase tracking-wide md:text-xl">
                {formatDate(metadata.race_date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-background/60">Data through</dt>
              <dd className="mt-1 font-display text-lg font-bold uppercase tracking-wide md:text-xl">
                {formatDate(metadata.data_through)}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {isRefetchError && (
          <p
            role="alert"
            className="mb-8 border-2 border-destructive bg-card px-4 py-3 text-sm font-medium text-destructive"
          >
            Could not refresh predictions — showing the last successful results.
          </p>
        )}

        {scenario && <ScenarioBanner scenario={scenario} onReset={lab.reset} />}

        {leader && (
          <section
            id="top-pick"
            aria-label={isScenario ? "Scenario top pick" : "Model's top pick"}
            aria-busy={lab.isRunning}
            className={`relative border-2 border-foreground bg-card p-6 md:p-10 ${lab.isRunning ? "opacity-70" : ""}`}
          >
            <div className="absolute left-0 top-0 h-2 w-full bg-primary" aria-hidden="true" />
            <p className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {isScenario && <ScenarioTag />}
              <span>{isScenario ? "Scenario top pick" : "The model's top pick"}</span>
            </p>
            <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <h2 className="font-display text-5xl font-black uppercase leading-none md:text-7xl">
                  {leader.driver}
                </h2>
                <p className="mt-2 text-base uppercase tracking-widest text-muted-foreground md:text-lg">
                  {leader.team}
                </p>
              </div>
              <div className="shrink-0 md:text-right">
                <span className="block font-display text-6xl font-black tabular-nums leading-none text-primary md:text-8xl">
                  {formatScore(leader.win_score)}
                </span>
                <span className="mt-2 block text-xs uppercase tracking-widest text-muted-foreground">
                  {isScenario ? `Scenario ${scoreLabel.toLowerCase()}` : scoreLabel}
                </span>
              </div>
            </div>
          </section>
        )}

        <section
          aria-label={isScenario ? "Top five drivers (scenario)" : "Top five drivers"}
          aria-busy={lab.isRunning}
          className={`mt-12 md:mt-16 ${lab.isRunning ? "opacity-70" : ""}`}
        >
          <h3 className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground pb-3 font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">
            <span>Top five drivers</span>
            {isScenario && <ScenarioTag />}
          </h3>
          <ol className="divide-y divide-border">
            {topFive.map((prediction, index) => (
              <ScoreRow
                key={prediction.driverId}
                rank={index + 1}
                driver={prediction.driver}
                team={prediction.team}
                score={prediction.win_score}
                maxScore={maxScore}
                isLeader={index === 0}
                note={rowNote(prediction.driverId, index + 1)}
                highlight={scenario?.driverId === prediction.driverId}
              />
            ))}
          </ol>
        </section>

        {rest.length > 0 && (
          <section
            aria-label={isScenario ? "Full field (scenario)" : "Full field"}
            aria-busy={lab.isRunning}
            className={`mt-4 ${lab.isRunning ? "opacity-70" : ""}`}
          >
            {!showAll && (
              <button
                onClick={() => setShowAll(true)}
                aria-expanded="false"
                className="w-full border-2 border-foreground px-5 py-3.5 font-display text-base font-bold uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
              >
                Show all drivers
              </button>
            )}
            {showAll && (
              <>
                <ol className="divide-y divide-border border-t-2 border-foreground">
                  {rest.map((prediction, index) => (
                    <ScoreRow
                      key={prediction.driverId}
                      rank={index + 6}
                      driver={prediction.driver}
                      team={prediction.team}
                      score={prediction.win_score}
                      maxScore={maxScore}
                      isLeader={false}
                      note={rowNote(prediction.driverId, index + 6)}
                      highlight={scenario?.driverId === prediction.driverId}
                    />
                  ))}
                </ol>
                <button
                  onClick={() => setShowAll(false)}
                  aria-expanded="true"
                  className="mt-4 w-full border-2 border-foreground px-5 py-3.5 font-display text-base font-bold uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
                >
                  Show top five only
                </button>
              </>
            )}
          </section>
        )}

        <aside className="mt-12 border-l-4 border-primary bg-card p-5 md:mt-16 md:p-6">
          <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            About the scores
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85 md:text-base">
            Scores show the model's relative preference across the field, not calibrated chances of
            winning.
          </p>
        </aside>

        <ScenarioLab {...lab} />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs uppercase tracking-widest text-muted-foreground">
          {metadata.race} · Baku City Circuit
        </div>
      </footer>
    </div>
  );
}
