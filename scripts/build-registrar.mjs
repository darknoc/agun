#!/usr/bin/env node
/**
 * build-registrar.mjs — freeze the issued-credential ledger from the compiled OKF graph.
 *
 * Downstream of build-okf.mjs. Reads public/okf/<version>/graph.json, projects every
 * `Credential` concept into a canonical registrar record, stamps each with a deterministic
 * verification hash, and writes:
 *   public/data/<version>/registrar/ledger.json              (the full ledger)
 *   public/data/<version>/registrar/verification/<id>.json   (per-credential verification entry)
 *
 * "Prepare, don't run": deterministic and reproducible. The hash is computed over the canonical
 * record only (not over generatedAt), so re-running produces identical ledger content.
 *
 * Zero dependencies (Node >= 18, ESM).
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ISSUER = 'https://agun.ai';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Resolve the active version via the latest pointer.
const latestPath = join(ROOT, 'public', 'okf', 'latest.json');
if (!existsSync(latestPath)) {
  console.error('❌ public/okf/latest.json not found. Run build-okf first.');
  process.exit(1);
}
const version = readJson(latestPath).version;
const graphPath = join(ROOT, 'public', 'okf', version, 'graph.json');
if (!existsSync(graphPath)) {
  console.error(`❌ ${graphPath} not found. Run build-okf first.`);
  process.exit(1);
}
const graph = readJson(graphPath);

const num = (v, d = 0) => (typeof v === 'number' ? v : v === undefined ? d : Number(v) || d);

const credentialNodes = Object.values(graph.nodes).filter((n) => n.type === 'Credential');
const errors = [];
const credentials = [];

for (const node of credentialNodes) {
  const fm = node.frontmatter;
  if (!fm.credentialId) {
    errors.push(`Credential missing credentialId: ${node.key}`);
    continue;
  }
  // Canonical record — the verification hash is computed over exactly these fields.
  const canonical = {
    credentialId: String(fm.credentialId),
    agentSlug: String(fm.agentSlug ?? ''),
    agentName: String(fm.agentName ?? node.title),
    certificationId: String(fm.certificationId ?? ''),
    level: String(fm.level ?? ''),
    compositeScore: num(fm.compositeScore),
    scores: {
      commandCorrectness: num(fm.commandCorrectness),
      situationalAppropriateness: num(fm.situationalAppropriateness),
      anticipatedImpact: num(fm.anticipatedImpact),
      doilCompliance: num(fm.doilCompliance),
    },
    issuedDate: String(fm.issuedDate ?? ''),
    issuer: String(fm.issuer ?? ISSUER),
    status: fm.status === 'revoked' ? 'revoked' : 'valid',
  };
  const verificationHash = createHash('sha256')
    .update(JSON.stringify(canonical))
    .digest('hex');
  credentials.push({ ...canonical, verificationHash });
}

if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`);
  console.error(`\nRegistrar build FAILED: ${errors.length} error(s).`);
  process.exit(1);
}

// Stable ordering by credentialId for reproducible output.
credentials.sort((a, b) => a.credentialId.localeCompare(b.credentialId));

const ledger = {
  catalogVersion: version,
  generatedAt: process.env.SOURCE_DATE_EPOCH
    ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
    : new Date().toISOString(),
  issuer: ISSUER,
  counts: {
    total: credentials.length,
    valid: credentials.filter((c) => c.status === 'valid').length,
    revoked: credentials.filter((c) => c.status === 'revoked').length,
  },
  credentials,
};

const outDir = join(ROOT, 'public', 'data', version, 'registrar');
mkdirSync(join(outDir, 'verification'), { recursive: true });
writeFileSync(join(outDir, 'ledger.json'), JSON.stringify(ledger, null, 2));
for (const c of credentials) {
  writeFileSync(
    join(outDir, 'verification', `${c.credentialId}.json`),
    JSON.stringify(
      { credentialId: c.credentialId, status: c.status, verificationHash: c.verificationHash, issuer: ISSUER },
      null,
      2,
    ),
  );
}

console.log(
  `✅ Registrar ${version} built: ${ledger.counts.total} credential(s) ` +
    `(valid:${ledger.counts.valid}, revoked:${ledger.counts.revoked}) → ` +
    `public/data/${version}/registrar/ledger.json`,
);
