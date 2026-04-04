export { EVALUATION_CRITERIA, RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"

export const EVALUATE_REASON_CODES = [
  { code: "E001", label: "Excellent implementation" },
  { code: "E002", label: "Good technical quality" },
  { code: "E003", label: "Satisfactory performance" },
  { code: "E004", label: "Needs improvement" },
  { code: "E005", label: "Incomplete submission" },
] as const
