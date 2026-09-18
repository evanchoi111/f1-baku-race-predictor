import * as SliderPrimitive from "@radix-ui/react-slider";
import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import {
  FINISH_MAX,
  FINISH_MIN,
  FINISH_STEP,
  clampFinish,
  formatScore,
  formatScoreChange,
  runPrediction,
  type DriverInput,
  type ModelResponse,
  type Prediction,
} from "@/lib/baku-model-client";

export const SCENARIO_EXPLANATION =
  "Explore how changing one input affects the model. Other inputs stay fixed.";

export type ScenarioResult = {
  driverId: string;
  driver: string;
  team: string;
  originalFinish: number | null;
  assumedFinish: number;
  predictions: Prediction[];
};

// Midpoint fallback used only when a driver has no recent-finish data at all.
const NO_DATA_FINISH = 11.5;

export function useScenarioLab(baseline: ModelResponse | undefined) {
  const [chosenDriverId, setChosenDriverId] = useState<string | null>(null);
  const [draftFinish, setDraftFinish] = useState<number | null>(null);
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const mutation = useMutation({ mutationFn: runPrediction });

  const inputs = baseline?.inputs ?? [];
  const basePredictions = baseline?.predictions ?? [];
  const defaultDriverId = basePredictions[0]?.driverId ?? inputs[0]?.driverId ?? null;
  const selectedDriverId =
    chosenDriverId && inputs.some((row) => row.driverId === chosenDriverId) ? chosenDriverId : defaultDriverId;
  const selectedInput = inputs.find((row) => row.driverId === selectedDriverId) ?? null;
  const originalFinish = selectedInput?.driver_finish_5 ?? null;
  const startingFinish = clampFinish(originalFinish ?? NO_DATA_FINISH);
  const sliderValue = draftFinish ?? startingFinish;

  const originalIndex = basePredictions.findIndex((row) => row.driverId === selectedDriverId);
  const originalScore = originalIndex >= 0 ? (basePredictions[originalIndex]?.win_score ?? null) : null;
  const scenarioIndex = scenario ? scenario.predictions.findIndex((row) => row.driverId === selectedDriverId) : -1;
  const scenarioScore = scenarioIndex >= 0 ? (scenario?.predictions[scenarioIndex]?.win_score ?? null) : null;

  const selectDriver = (driverId: string) => {
    setChosenDriverId(driverId);
    setDraftFinish(null);
    setScenario(null);
    mutation.reset();
  };

  const setFinish = (value: number) => setDraftFinish(clampFinish(value));

  const reset = () => {
    setDraftFinish(null);
    setScenario(null);
    mutation.reset();
  };

  const run = () => {
    if (!baseline || !selectedInput || mutation.isPending) return;
    const assumedFinish = clampFinish(sliderValue);
    const nextInputs: DriverInput[] = baseline.inputs.map((row) =>
      row.driverId === selectedInput.driverId ? { ...row, driver_finish_5: assumedFinish } : row,
    );
    mutation.mutate(nextInputs, {
      onSuccess: (response) => {
        setScenario({
          driverId: selectedInput.driverId,
          driver: selectedInput.driver,
          team: selectedInput.team,
          originalFinish,
          assumedFinish,
          predictions: response.predictions,
        });
      },
    });
  };

  return {
    inputs,
    selectedDriverId,
    selectedInput,
    originalFinish,
    startingFinish,
    sliderValue,
    scenario,
    activePredictions: scenario?.predictions ?? basePredictions,
    originalScore,
    scenarioScore,
    originalRank: originalIndex >= 0 ? originalIndex + 1 : null,
    scenarioRank: scenarioIndex >= 0 ? scenarioIndex + 1 : null,
    isRunning: mutation.isPending,
    error: mutation.isError ? (mutation.error instanceof Error ? mutation.error.message : "Scenario request failed") : null,
    isDirty: draftFinish !== null && draftFinish !== startingFinish,
    selectDriver,
    setFinish,
    run,
    reset,
  };
}

export type ScenarioLabState = ReturnType<typeof useScenarioLab>;

export function ScenarioTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block bg-primary px-2 py-0.5 align-middle font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary-foreground ${className}`}
    >
      Scenario
    </span>
  );
}

export function ScenarioBanner({ scenario, onReset }: { scenario: ScenarioResult; onReset: () => void }) {
  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-4 border-2 border-foreground bg-foreground px-5 py-4 text-background md:flex-row md:items-center md:justify-between"
    >
      <p className="text-sm leading-relaxed md:text-base">
        <ScenarioTag className="mr-3" />
        Results below assume <span className="font-semibold">{scenario.driver}</span>'s recent average finish is{" "}
        <span className="font-semibold tabular-nums">{scenario.assumedFinish.toFixed(1)}</span>
        {scenario.originalFinish !== null && (
          <>
            {" "}
            instead of <span className="tabular-nums">{scenario.originalFinish.toFixed(1)}</span>
          </>
        )}
        . Other inputs unchanged.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="shrink-0 border-2 border-background px-4 py-2 font-display text-sm font-bold uppercase tracking-widest transition-colors hover:bg-background hover:text-foreground"
      >
        Back to original
      </button>
    </div>
  );
}

function FinishSlider({
  value,
  onChange,
  labelId,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  labelId: string;
  disabled?: boolean;
}) {
  return (
    <SliderPrimitive.Root
      min={FINISH_MIN}
      max={FINISH_MAX}
      step={FINISH_STEP}
      value={[value]}
      disabled={disabled === true}
      onValueChange={(next) => {
        const [first] = next;
        if (typeof first === "number") onChange(first);
      }}
      className="relative flex w-full touch-none select-none items-center py-3"
    >
      <SliderPrimitive.Track className="relative h-2.5 w-full grow bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-labelledby={labelId}
        aria-valuetext={`${value.toFixed(1)} average finish`}
        className="block h-6 w-6 cursor-grab border-2 border-foreground bg-background transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  );
}

function Stat({
  label,
  value,
  caption,
  emphasis = false,
  pending = false,
}: {
  label: string;
  value: string;
  caption?: string | undefined;
  emphasis?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="border-t-2 border-foreground pt-3">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground md:text-xs">
        {label}
      </dt>
      <dd
        className={`mt-1 font-display text-4xl font-black tabular-nums leading-none md:text-5xl ${
          emphasis ? "text-primary" : ""
        } ${pending ? "opacity-40" : ""}`}
      >
        {value}
      </dd>
      {caption && (
        <dd className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">{caption}</dd>
      )}
    </div>
  );
}

export function ScenarioLab(state: ScenarioLabState) {
  const {
    inputs,
    selectedDriverId,
    selectedInput,
    originalFinish,
    startingFinish,
    sliderValue,
    scenario,
    activePredictions,
    originalScore,
    scenarioScore,
    originalRank,
    scenarioRank,
    isRunning,
    error,
    isDirty,
    selectDriver,
    setFinish,
    run,
    reset,
  } = state;
  const selectId = useId();
  const sliderLabelId = useId();

  if (inputs.length === 0 || !selectedInput || !selectedDriverId) return null;

  const hasScenario = scenario !== null && scenarioScore !== null;
  const delta = hasScenario && originalScore !== null ? scenarioScore - originalScore : null;
  const scenarioLeader = scenario?.predictions[0] ?? null;
  const canReset = hasScenario || isDirty || error !== null;
  const changeCaption =
    delta === null
      ? "Percentage points"
      : delta > 0
        ? "Percentage points · higher"
        : delta < 0
          ? "Percentage points · lower"
          : "No change";

  return (
    <section id="scenario-lab" aria-labelledby="scenario-lab-heading" className="mt-12 md:mt-16">
      <div className="border-b-2 border-foreground pb-3">
        <h3
          id="scenario-lab-heading"
          className="font-display text-2xl font-bold uppercase tracking-wide md:text-3xl"
        >
          Scenario lab
        </h3>
        <p className="mt-1 text-sm text-foreground/80 md:text-base">{SCENARIO_EXPLANATION}</p>
      </div>

      <div className="relative mt-6 border-2 border-foreground bg-card">
        <div className="absolute left-0 top-0 h-2 w-full bg-primary" aria-hidden="true" />
        <div className="grid gap-8 p-6 pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-12 md:p-10 md:pt-12">
          <div>
            <label
              htmlFor={selectId}
              className="block text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
            >
              Driver
            </label>
            <div className="relative mt-3">
              <select
                id={selectId}
                value={selectedDriverId}
                onChange={(event) => selectDriver(event.target.value)}
                disabled={isRunning}
                className="w-full appearance-none border-2 border-foreground bg-background py-3 pl-4 pr-12 font-display text-xl font-bold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-60 md:text-2xl"
              >
                {inputs.map((row) => (
                  <option key={row.driverId} value={row.driverId}>
                    {row.driver}
                  </option>
                ))}
              </select>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-display text-xl font-bold"
              >
                ▾
              </span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground md:text-sm">
              {selectedInput.team}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Actual recent avg. finish</dt>
                <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
                  {originalFinish === null ? "No data" : originalFinish.toFixed(1)}
                </dd>
              </div>
              <div>
                <dt className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Original rank</dt>
                <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
                  {originalRank === null ? "—" : `P${originalRank}`}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <span
                id={sliderLabelId}
                className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
              >
                Assumed recent average finish
              </span>
              <output
                htmlFor={sliderLabelId}
                aria-live="off"
                className="font-display text-5xl font-black tabular-nums leading-none text-primary md:text-6xl"
              >
                {sliderValue.toFixed(1)}
              </output>
            </div>
            <div className="mt-3">
              <FinishSlider value={sliderValue} onChange={setFinish} labelId={sliderLabelId} disabled={isRunning} />
            </div>
            <div className="flex justify-between text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
              <span>{FINISH_MIN.toFixed(0)} · Best</span>
              <span>
                Starting value {startingFinish.toFixed(1)}
                {originalFinish === null ? " (no data)" : ""}
              </span>
              <span>{FINISH_MAX.toFixed(0)} · Worst</span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={run}
                disabled={isRunning}
                aria-busy={isRunning}
                className="bg-primary px-6 py-3.5 font-display text-base font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-racing-dark disabled:cursor-wait disabled:opacity-70"
              >
                {isRunning ? "Running…" : "Run scenario"}
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={isRunning || !canReset}
                className="border-2 border-foreground px-6 py-3.5 font-display text-base font-bold uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 min-h-[1.5rem]" aria-live="polite">
              {isRunning && (
                <p className="text-sm uppercase tracking-widest text-muted-foreground">
                  Rescoring the full field…
                </p>
              )}
              {!isRunning && error && (
                <p
                  role="alert"
                  className="border-2 border-destructive bg-background px-4 py-3 text-sm font-medium text-destructive"
                >
                  Could not run this scenario ({error}).{" "}
                  {hasScenario
                    ? "Showing the last successful scenario."
                    : "Showing the original predictions."}{" "}
                  Try again.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t-2 border-foreground bg-background/60 p-6 md:p-10" aria-busy={isRunning}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {selectedInput.driver} · Score comparison
            </h4>
            {hasScenario && <ScenarioTag />}
          </div>
          <dl className="mt-4 grid gap-6 sm:grid-cols-3 md:gap-10">
            <Stat
              label="Original model score"
              value={originalScore === null ? "—" : formatScore(originalScore)}
              caption={originalRank === null ? undefined : `Ranked P${originalRank}`}
            />
            <Stat
              label="Scenario model score"
              value={hasScenario && scenarioScore !== null ? formatScore(scenarioScore) : "—"}
              caption={
                hasScenario && scenarioRank !== null
                  ? `Ranked P${scenarioRank}${
                      originalRank !== null && scenarioRank !== originalRank ? ` (was P${originalRank})` : ""
                    }`
                  : "Run a scenario to compare"
              }
              pending={isRunning}
            />
            <Stat
              label="Model score change"
              value={delta === null ? "—" : formatScoreChange(delta)}
              caption={changeCaption}
              emphasis={delta !== null && delta !== 0}
              pending={isRunning}
            />
          </dl>
          {hasScenario && scenarioLeader && (
            <p className="mt-6 text-sm leading-relaxed text-foreground/85 md:text-base">
              Scenario top pick: <span className="font-semibold">{scenarioLeader.driver}</span> ({scenarioLeader.team}) at{" "}
              <span className="font-semibold tabular-nums">{formatScore(scenarioLeader.win_score)}</span>. The rankings
              above now show this scenario; use Reset to return to the original predictions.
            </p>
          )}
          {!hasScenario && !isRunning && (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground md:text-base">
              Move the slider and run the scenario to see how {selectedInput.driver}'s model score and the field's
              rankings respond. {activePredictions.length} drivers are rescored together.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
