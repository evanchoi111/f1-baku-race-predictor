export type FeatureValue = number | null;

export type ModelInput = {
  driverId: string;
  constructorId: string;
  driver: string;
  team: string;
  driver_finish_5: FeatureValue;
  driver_points_5: FeatureValue;
  driver_win_rate_5: FeatureValue;
  driver_podium_rate_5: FeatureValue;
  team_points_5: FeatureValue;
  team_win_rate_5: FeatureValue;
  circuit_finish_3: FeatureValue;
  circuit_win_rate_3: FeatureValue;
  driver_history_count: FeatureValue;
};

export type Prediction = {
  driverId: string;
  driver: string;
  team: string;
  win_score: number;
};

type Tree = {
  left_children: number[];
  right_children: number[];
  split_type: number[];
  split_indices: number[];
  split_conditions: number[];
  default_left: number[];
};

type XGBoostModel = {
  learner: {
    objective: { name: string };
    feature_names: string[];
    learner_model_param: { base_score: string };
    gradient_booster: { model: { trees: Tree[] } };
  };
};

export function predictRaw(model: XGBoostModel, row: ModelInput) {
  const learner = model.learner;
  if (learner.objective.name !== "binary:logistic") throw new Error("Unsupported objective");
  const baseValue = JSON.parse(learner.learner_model_param.base_score) as number | number[];
  const base = Array.isArray(baseValue) ? baseValue[0] : baseValue;
  if (base === undefined) throw new Error("Invalid model base score");
  let margin = Math.fround(Math.log(base / (1 - base)));

  for (const tree of learner.gradient_booster.model.trees) {
    let node = 0;
    while (tree.left_children[node] !== -1) {
      if (tree.split_type[node] !== 0) throw new Error("Categorical split unsupported");
      const featureName = learner.feature_names[tree.split_indices[node] ?? -1];
      if (!featureName) throw new Error("Invalid model split");
      const value = row[featureName as keyof ModelInput] as FeatureValue;
      const missing = value === null || value === undefined || Number.isNaN(value);
      if (!missing && !Number.isFinite(value)) throw new Error("Invalid numeric input");
      const split = tree.split_conditions[node];
      if (split === undefined) throw new Error("Invalid model threshold");
      const goLeft = missing
        ? Boolean(tree.default_left[node])
        : Math.fround(value) < Math.fround(split);
      const nextNode = goLeft ? tree.left_children[node] : tree.right_children[node];
      if (nextNode === undefined) throw new Error("Invalid model tree");
      node = nextNode;
    }
    const leaf = tree.split_conditions[node];
    if (leaf === undefined) throw new Error("Invalid model leaf");
    margin = Math.fround(margin + Math.fround(leaf));
  }
  return 1 / (1 + Math.exp(-margin));
}

export function predictField(model: XGBoostModel, rows: ModelInput[]): Prediction[] {
  if (!rows.length || new Set(rows.map((row) => row.driverId)).size !== rows.length) {
    throw new Error("Supply a nonempty field with unique drivers");
  }
  const raw = rows.map((row) => predictRaw(model, row));
  const total = raw.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) throw new Error("Invalid prediction total");
  return rows
    .map((row, index) => ({
      driverId: row.driverId,
      driver: row.driver,
      team: row.team,
      win_score: (raw[index] ?? 0) / total,
    }))
    .sort((a, b) => b.win_score - a.win_score);
}
