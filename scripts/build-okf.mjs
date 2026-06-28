#!/usr/bin/env node
/**
 * build-okf.mjs — compile the OKF source bundle (knowledge/) into a version-pinned,
 * queryable graph artifact at public/okf/<version>/graph.json.
 *
 * This is a "prepare" job: run on demand, NOT a continuous process. It freezes a
 * reproducible snapshot of the registrar that the Next.js app and the University MCP read.
 *
 * Zero dependencies (Node >= 18, ESM). Validation: every concept needs `type`; cross-links
 * must resolve; reports orphans. Exits non-zero on hard errors so it can gate the build.
 *
 * Mirrors agym-ai/scripts/build-okf.mjs so both repos share one compiler contract.
 */
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, dirname, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const KNOWLEDGE = join(ROOT, 'knowledge');

/** Recursively collect .md files. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

/** Minimal YAML-frontmatter parser — scalars, [inline, arrays], numbers, booleans. */
function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: null, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { data: null, body: raw };
  const fmBlock = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, '');
  const data = {};
  for (const line of fmBlock.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => coerce(s.trim())).filter((s) => s !== '');
    } else {
      val = coerce(val);
    }
    data[key] = val;
  }
  return { data, body };
}

function coerce(s) {
  if (s === '') return '';
  const unq = s.replace(/^["']|["']$/g, '');
  if (unq !== s) return unq; // was quoted → string
  if (/^-?\d+$/.test(s)) return Number(s);
  if (/^-?\d+\.\d+$/.test(s)) return Number(s);
  if (s === 'true') return true;
  if (s === 'false') return false;
  return unq;
}

/** Extract markdown links [text](target.md ...) pointing at other .md files. */
function extractLinks(body, fromAbsDir) {
  const links = [];
  const re = /\]\(([^)\s]+\.md)(?:#[^)]*)?\)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const target = m[1];
    if (/^https?:/.test(target)) continue;
    const abs = resolve(fromAbsDir, target);
    links.push(relKey(abs));
  }
  return links;
}

const relKey = (abs) => posix.normalize(relative(KNOWLEDGE, abs).split('\\').join('/'));

// ---- build ----
const files = walk(KNOWLEDGE);
const nodes = {};
const errors = [];
const warnings = [];

for (const file of files) {
  const key = relKey(file);
  const raw = readFileSync(file, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const base = key.split('/').pop();
  if (!data) {
    // Non-concept supporting files (README.md, log.md) are allowed without frontmatter.
    if (base !== 'README.md' && base !== 'log.md') {
      warnings.push(`No frontmatter (skipped as non-concept): ${key}`);
    }
    continue;
  }
  if (!data.type) errors.push(`Missing required \`type\` field: ${key}`);
  const links = extractLinks(body, dirname(file));
  nodes[key] = {
    key,
    type: data.type ?? 'Unknown',
    title: data.title ?? base,
    frontmatter: data,
    links,
    body,
  };
}

// Validate cross-links resolve.
for (const node of Object.values(nodes)) {
  for (const target of node.links) {
    if (!nodes[target] && !target.endsWith('README.md')) {
      errors.push(`Broken link: ${node.key} → ${target}`);
    }
  }
}

// Inbound counts → orphan detection (root University / Index are allowed to be orphans).
const inbound = Object.fromEntries(Object.keys(nodes).map((k) => [k, 0]));
for (const node of Object.values(nodes))
  for (const t of node.links) if (inbound[t] !== undefined) inbound[t] += 1;
for (const node of Object.values(nodes)) {
  if (inbound[node.key] === 0 && node.type !== 'University' && node.type !== 'Index') {
    warnings.push(`Orphan concept (no inbound links): ${node.key}`);
  }
}

const version =
  Object.values(nodes).find((n) => n.type === 'University')?.frontmatter.catalogVersion ?? 'v0.1';

const byType = {};
for (const n of Object.values(nodes)) (byType[n.type] ??= []).push(n.key);

const graph = {
  okfVersion: '0.1',
  catalogVersion: version,
  generatedAt: process.env.SOURCE_DATE_EPOCH
    ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
    : new Date().toISOString(),
  counts: Object.fromEntries(Object.entries(byType).map(([t, a]) => [t, a.length])),
  nodes,
};

// Report.
for (const w of warnings) console.warn(`⚠️  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`);
  console.error(`\nOKF build FAILED: ${errors.length} error(s).`);
  process.exit(1);
}

const outDir = join(ROOT, 'public', 'okf', version);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'graph.json'), JSON.stringify(graph, null, 2));
// Maintain a `latest` pointer for convenient app loading.
mkdirSync(join(ROOT, 'public', 'okf'), { recursive: true });
writeFileSync(join(ROOT, 'public', 'okf', 'latest.json'), JSON.stringify({ version }, null, 2));

console.log(
  `✅ OKF ${version} built: ${Object.keys(nodes).length} concepts ` +
    `(${Object.entries(graph.counts).map(([t, c]) => `${t}:${c}`).join(', ')}) → ` +
    `public/okf/${version}/graph.json`
);
