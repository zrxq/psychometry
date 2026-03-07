import type { ComputedResult, TestDefinition } from "../types";

export function computeResult(
  definition: TestDefinition,
  answers: Array<number | null>,
): ComputedResult {
  const answered = answers.filter((value): value is number => value !== null);
  const total = answered.reduce((sum, value) => sum + value, 0);
  const isComplete =
    definition.questions.length > 0 &&
    answered.length === definition.questions.length;
  const band = definition.scoring.bands.find(
    (entry) => total >= entry.min && total <= entry.max,
  ) ?? null;

  return {
    total,
    answeredCount: answered.length,
    band,
    isComplete,
  };
}
