import modelData from "./baku-model-data.server.json";
import { predictField, predictRaw, type ModelInput } from "./xgboost-baku.server";

const data = modelData as unknown as {
  model: Parameters<typeof predictField>[0];
  metadata: Record<string, unknown> & { predictions: unknown[] };
  inputs: ModelInput[];
  verification: Array<{ name: string; inputs: ModelInput[]; raw_scores: number[]; win_scores: number[] }>;
};

export const featureNames = [
  "driver_finish_5", "driver_points_5", "driver_win_rate_5", "driver_podium_rate_5",
  "team_points_5", "team_win_rate_5", "circuit_finish_3", "circuit_win_rate_3", "driver_history_count",
] as const;

export function validateInputs(value: unknown): ModelInput[] {
  if (!Array.isArray(value) || value.length !== data.inputs.length) throw new Error(`Expected ${data.inputs.length} driver rows`);
  const expectedById = new Map(data.inputs.map((row) => [row.driverId, row]));
  const seen = new Set<string>();
  const rows = value.map((candidate) => {
    if (!candidate || typeof candidate !== "object") throw new Error("Every driver row must be an object");
    const row = candidate as Record<string, unknown>;
    const driverId = row["driverId"];
    if (typeof driverId !== "string" || !expectedById.has(driverId)) throw new Error("Unknown driver in prediction field");
    if (seen.has(driverId)) throw new Error("Driver rows must be unique");
    seen.add(driverId);
    for (const feature of featureNames) {
      const featureValue = row[feature];
      if (featureValue !== null && (typeof featureValue !== "number" || !Number.isFinite(featureValue))) throw new Error(`${feature} must be a finite number or null`);
    }
    const identity = expectedById.get(driverId)!;
    return { ...identity, ...Object.fromEntries(featureNames.map((feature) => [feature, row[feature]])) } as ModelInput;
  });
  if (seen.size !== expectedById.size) throw new Error("Prediction field is incomplete");
  return rows;
}

export function getModelResponse(inputs: ModelInput[] = data.inputs) {
  const predictions = predictField(data.model, inputs);
  const { predictions: _snapshotPredictions, ...metadata } = data.metadata;
  return { metadata, inputs, predictions };
}

export function verifyReferenceCases(tolerance = 1e-7) {
  const cases = data.verification.map((testCase) => {
    const raw = testCase.inputs.map((row) => predictRaw(data.model, row));
    const fieldById = new Map(predictField(data.model, testCase.inputs).map((prediction) => [prediction.driverId, prediction.win_score]));
    const maxRawError = Math.max(...raw.map((value, index) => Math.abs(value - (testCase.raw_scores[index] ?? Number.NaN))));
    const maxFieldError = Math.max(...testCase.inputs.map((row, index) => Math.abs((fieldById.get(row["driverId"]) ?? Number.NaN) - (testCase.win_scores[index] ?? Number.NaN))));
    return { name: testCase.name, passed: maxRawError <= tolerance && maxFieldError <= tolerance, maxRawError, maxFieldError };
  });
  return { passed: cases.every((testCase) => testCase.passed), tolerance, cases };
}
