// Client-safe types and fetch helpers for the Baku prediction API.
// The model itself, its evaluation, and verification stay server-side.

export type Prediction = { driverId: string; driver: string; team: string; win_score: number };

export type DriverInput = {
  driverId: string;
  constructorId: string;
  driver: string;
  team: string;
  driver_finish_5: number | null;
  driver_points_5: number | null;
  driver_win_rate_5: number | null;
  driver_podium_rate_5: number | null;
  team_points_5: number | null;
  team_win_rate_5: number | null;
  circuit_finish_3: number | null;
  circuit_win_rate_3: number | null;
  driver_history_count: number | null;
};

export type ModelMetadata = {
  race: string;
  circuit: string;
  year: number;
  race_date: string;
  data_through: string;
  score_label?: string;
};

export type ModelResponse = {
  metadata: ModelMetadata;
  inputs: DriverInput[];
  predictions: Prediction[];
};

type ApiError = { error?: string };

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  let body: (T & ApiError) | null = null;
  try {
    body = (await response.json()) as T & ApiError;
  } catch {
    body = null;
  }
  if (!response.ok || !body) throw new Error(body?.error || fallback);
  return body;
}

export async function fetchModel(): Promise<ModelResponse> {
  const response = await fetch("/api/model");
  return readJson<ModelResponse>(response, "Prediction service unavailable");
}

export async function runPrediction(inputs: DriverInput[]): Promise<ModelResponse> {
  const response = await fetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputs }),
  });
  return readJson<ModelResponse>(response, "Scenario request failed");
}

export function formatScore(score: number) {
  return `${(score * 100).toFixed(1)}%`;
}

/** Signed difference between two scores, in percentage points (e.g. "+3.2"). */
export function formatScoreChange(delta: number) {
  const points = delta * 100;
  const rounded = Math.round(points * 10) / 10;
  if (rounded === 0) return "0.0";
  return `${rounded > 0 ? "+" : "\u2212"}${Math.abs(rounded).toFixed(1)}`;
}

export const FINISH_MIN = 1;
export const FINISH_MAX = 22;
export const FINISH_STEP = 0.1;

export function clampFinish(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Math.min(FINISH_MAX, Math.max(FINISH_MIN, rounded));
}
