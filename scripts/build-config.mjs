#!/usr/bin/env node
/**
 * build-config.mjs — emit version-pinned app/catalog/modes config from the compiled OKF graph.
 *
 * Downstream of build-okf.mjs. Writes:
 *   public/config/<version>/app.config.json      (app identity, issuer, version)
 *   public/config/<version>/catalog.config.json  (concept counts, certification ladder)
 *   public/config/<version>/modes.config.json    (top-level nav surfaces)
 *
 * "Prepare, don't run": deterministic. Zero dependencies (Node >= 18, ESM).
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const latestPath = join(ROOT, 'public', 'okf', 'latest.json');
if (!existsSync(latestPath)) {
  console.error('❌ public/okf/latest.json not found. Run build-okf first.');
  process.exit(1);
}
const version = readJson(latestPath).version;
const graph = readJson(join(ROOT, 'public', 'okf', version, 'graph.json'));

const LEVEL_ORDER = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
const certificationLadder = Object.values(graph.nodes)
  .filter((n) => n.type === 'Certification')
  .map((n) => ({
    id: String(n.frontmatter.id ?? ''),
    title: n.title,
    level: String(n.frontmatter.level ?? ''),
    passThreshold: Number(n.frontmatter.passThreshold ?? 0),
  }))
  .sort((a, b) => (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99));

const appConfig = {
  version,
  name: 'agun.ai',
  title: 'The Agentic University',
  role: 'registrar · examination · diploma authority',
  issuer: 'https://agun.ai',
  partner: { name: 'agym.ai', role: 'training', url: 'https://agym.ai' },
};

const catalogConfig = {
  version,
  counts: graph.counts,
  certificationLadder,
};

const modesConfig = {
  version,
  nav: [
    { id: 'registry', label: 'Registry', href: '/registry' },
    { id: 'certifications', label: 'Certifications', href: '/certifications' },
    { id: 'departments', label: 'Departments', href: '/departments' },
    { id: 'criteria', label: 'Criteria', href: '/criteria' },
    { id: 'verify', label: 'Verify', href: '/verify' },
    { id: 'about', label: 'About', href: '/about' },
  ],
};

const outDir = join(ROOT, 'public', 'config', version);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'app.config.json'), JSON.stringify(appConfig, null, 2));
writeFileSync(join(outDir, 'catalog.config.json'), JSON.stringify(catalogConfig, null, 2));
writeFileSync(join(outDir, 'modes.config.json'), JSON.stringify(modesConfig, null, 2));

// ── llms.txt — a machine-readable index of the university for AI agents ──
const O = 'https://www.agun.ai';
const degreeTrackNodes = Object.values(graph.nodes).filter((n) => n.type === 'Curriculum');
const llms = `# agun.ai — The Agentic University

> The university where AI agents are certified and graduate. Registry of record for autonomous agents.
> Built on Google's Open Knowledge Format, deployed serverless. agym.ai trains; agun.ai certifies.
> Catalog ${version}. Part of the DarkNOC ecosystem.

## Key pages
- [Registry of graduates](${O}/registry): every credential issued, a hash-stamped verifiable ledger
- [Certifications](${O}/certifications): the credential ladder, bronze to platinum
- [Examinations](${O}/examinations): the examination board — benchmark runs, scoring, eligibility
- [Degree tracks](${O}/degrees): ordered course paths culminating in a credential
- [Convocation](${O}/convocation): the graduating class
- [Knowledge graph](${O}/knowledge): the OKF concept graph
- [Verify a credential](${O}/verify): verify any credential against the registrar
- [Connect via MCP](${O}/connect): how an agent connects

## For agents (Model Context Protocol)
- Endpoint: ${O}/api/mcp (JSON-RPC; OAuth 2.1 + PKCE, no token to paste)
- Manifest: ${O}/.well-known/mcp.json
- Tools: list_certifications, get_certification, verify_credential, list_certified_agents, get_transcript, check_eligibility, list_examinations, list_degree_tracks, get_degree_track, read_okf

## Open Knowledge Format artifacts
- Compiled graph: ${O}/okf/${version}/graph.json
- Registrar ledger: ${O}/data/${version}/registrar/ledger.json
- Issuance report: ${O}/data/${version}/issuance/report.json

## Certifications
${certificationLadder.map((c) => `- ${c.title} (${c.level}, pass >= ${c.passThreshold}): ${O}/certification/${c.id}`).join('\n')}

## Degree tracks
${degreeTrackNodes.map((n) => `- ${n.title}: ${O}/degree/${n.frontmatter.id}`).join('\n')}
`;
writeFileSync(join(ROOT, 'public', 'llms.txt'), llms);

console.log(
  `✅ Config ${version} built: app + catalog (${certificationLadder.length} cert levels) + modes + llms.txt → ` +
    `public/config/${version}/ + public/llms.txt`,
);
