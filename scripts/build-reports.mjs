/**
 * build-reports.mjs — folds the Apply-It outcome reports (reports/reports.json) into each Lesson's
 * compiled evidence: applyCount, avgValue, and the most recent outcomes. Runs AFTER build-okf and
 * BEFORE build-mcp-bundle, so both the app's graph and the MCP bundle reflect compounded evidence.
 * Zero deps. No reports file → no-op.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const reportsPath = join(ROOT, "reports", "reports.json");
const reports = existsSync(reportsPath) ? JSON.parse(readFileSync(reportsPath, "utf8")) : [];

const version = JSON.parse(readFileSync(join(ROOT, "public", "okf", "latest.json"), "utf8")).version;
const graphPath = join(ROOT, "public", "okf", version, "graph.json");
const graph = JSON.parse(readFileSync(graphPath, "utf8"));

const byLesson = {};
for (const r of reports) {
  if (!r || !r.lessonId) continue;
  (byLesson[r.lessonId] ??= []).push(r);
}

let lessons = 0;
let folded = 0;
for (const node of Object.values(graph.nodes)) {
  if (node.type !== "Lesson") continue;
  lessons++;
  const id = node.frontmatter.id ?? node.key;
  const rs = byLesson[id] ?? [];
  node.frontmatter.applyCount = rs.length;
  if (rs.length) {
    folded += rs.length;
    node.frontmatter.recentOutcomes = rs
      .slice(-3)
      .reverse()
      .map((r) => ({ agentSlug: r.agentSlug, metric: r.metric, value: r.value, ts: r.ts, notes: r.notes ?? null }));
    const nums = rs.map((r) => Number(r.value)).filter((n) => !Number.isNaN(n));
    if (nums.length) node.frontmatter.avgValue = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
  } else {
    delete node.frontmatter.recentOutcomes;
  }
}

writeFileSync(graphPath, JSON.stringify(graph, null, 2));
console.log(`✅ reports: ${reports.length} report(s), ${folded} folded into ${lessons} lesson(s) → ${graphPath.split("/").slice(-3).join("/")}`);
