/**
 * lib/scoring.mjs — the shared scoring + eligibility engine.
 *
 * Pure, zero-dep. Used by the issuance generator (scripts/build-issuance.mjs) and importable by
 * the app/MCP so everyone computes a credential the same way. The four evaluation layers are the
 * contract shared with agym; the composite is their mean.
 */

export const LAYERS = ["commandCorrectness", "situationalAppropriateness", "anticipatedImpact", "doilCompliance"];

/** Composite on a 0–1 scale (mean of the four layers). */
export function composite(scores) {
  const vals = LAYERS.map((k) => Number(scores?.[k]) || 0);
  return vals.reduce((a, b) => a + b, 0) / LAYERS.length;
}

/** Composite on a 0–100 scale (the exam scale). */
export function compositePct(scores) {
  return Math.round(composite(scores) * 100);
}

/** Letter grade from a 0–100 composite. */
export function grade(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 80) return "A-";
  if (pct >= 75) return "B+";
  if (pct >= 73) return "B";
  if (pct >= 70) return "B-";
  if (pct >= 65) return "C+";
  if (pct >= 60) return "C";
  if (pct >= 50) return "C-";
  return "F";
}

/**
 * Evaluate one run against a certification track.
 * track: { id, passThreshold, benchmark, requiredCourses, requiredSkills }
 * Returns { eligible, composite, grade, threshold, gap, benchmarkMatch, reasons }.
 *
 * Note: course/skill completion is produced at agym.ai and is not verifiable from a run alone;
 * those are reported as advisory until live agym ingestion lands.
 */
export function evaluateEligibility(run, track) {
  const pct = compositePct(run.scores);
  const threshold = Number(track.passThreshold) || 0;
  const benchmarkMatch = !track.benchmark || run.benchmark === track.benchmark;
  const compositePass = pct >= threshold;
  const eligible = compositePass && benchmarkMatch && run.status === "completed";

  const reasons = [];
  reasons.push(`Composite ${pct} ${compositePass ? "≥" : "<"} ${threshold} (pass threshold)`);
  if (!benchmarkMatch) reasons.push(`Run benchmark "${run.benchmark}" ≠ governing benchmark "${track.benchmark}"`);
  if (run.status !== "completed") reasons.push(`Run status is "${run.status}"`);

  return { eligible, composite: pct, grade: grade(pct), threshold, gap: pct - threshold, benchmarkMatch, reasons };
}
