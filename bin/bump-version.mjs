#!/usr/bin/env node
/**
 * @freetison/bump-version
 *
 * Auto-bumps package.json version based on Conventional Commits between
 * BASE_BRANCH and the current branch. Designed to run inside husky pre-commit.
 *
 * Bump rules (Conventional Commits):
 *   feat! | fix! | refactor! | BREAKING CHANGE  →  major
 *   feat(...)                                   →  minor
 *   anything else                               →  patch
 *
 * Skips when:
 *   - Already on BASE_BRANCH (default: main)
 *   - No commits ahead of BASE_BRANCH
 *
 * Usage:
 *   bump-version               # auto-detect bump, update package.json, git add
 *   bump-version --dry-run     # print what would happen, no changes
 *   bump-version --verbose     # extra debug output
 *
 * Environment:
 *   BASE_BRANCH   branch to compare against (default: main)
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// ── Helpers ───────────────────────────────────────────────────────────────────
function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function verbose(...msg) {
  if (VERBOSE) console.log('[bump-version]', ...msg);
}

// ── Read package.json ─────────────────────────────────────────────────────────
const pkgPath = resolve(process.cwd(), 'package.json');

if (!existsSync(pkgPath)) {
  // Non-JS repo (Python, Docker, etc.) — nothing to version-bump, skip silently.
  verbose('no package.json found, skipping.');
  process.exit(0);
}

let pkg;
try {
  pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
} catch (e) {
  console.error('❌ bump-version: could not parse package.json:', e.message);
  process.exit(1);
}

const name = pkg.name ?? '(unknown)';
const current = pkg.version ?? '0.0.0';

// ── Branch ────────────────────────────────────────────────────────────────────
const base = process.env.BASE_BRANCH ?? 'main';
const branch = run('git rev-parse --abbrev-ref HEAD');

verbose(`branch=${branch}  base=${base}`);

if (!branch || branch === base) {
  verbose('on base branch or detached HEAD, skipping.');
  process.exit(0);
}

// ── Commits ───────────────────────────────────────────────────────────────────
const raw = run(`git log --pretty=format:%s ${base}..${branch}`);

if (!raw) {
  verbose('no commits ahead of base branch, skipping.');
  process.exit(0);
}

const commits = raw.split('\n').map((s) => s.trim()).filter(Boolean);
verbose(`${commits.length} commit(s): ${commits.join(' | ')}`);

// ── Detect bump type ──────────────────────────────────────────────────────────
const MAJOR_RE = /^(feat|fix|refactor)!|BREAKING CHANGE/;
const MINOR_RE = /^feat(\(.+\))?:/;

let bump = 'patch';
if (commits.some((c) => MAJOR_RE.test(c))) bump = 'major';
else if (commits.some((c) => MINOR_RE.test(c))) bump = 'minor';

verbose(`bump type: ${bump}`);

if (DRY_RUN) {
  console.log(`📦 [dry-run] ${name}: v${current} → ${bump}`);
  process.exit(0);
}

// ── Apply bump ────────────────────────────────────────────────────────────────
const pm = run('pnpm --version') ? 'pnpm' : run('npm --version') ? 'npm' : null;

if (!pm) {
  console.error('❌ bump-version: neither pnpm nor npm found.');
  process.exit(1);
}

const pmOut = run(`${pm} version ${bump} --no-git-tag-version`);

if (!pmOut) {
  // Manual fallback (e.g. private:true workspaces that reject npm version)
  const [maj, min, pat] = current.split('.').map(Number);
  const next =
    bump === 'major' ? `${maj + 1}.0.0`
    : bump === 'minor' ? `${maj}.${min + 1}.0`
    : `${maj}.${min}.${pat + 1}`;
  pkg.version = next;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  verbose(`fallback write: v${next}`);
}

const next = JSON.parse(readFileSync(pkgPath, 'utf8')).version;
console.log(`📦 ${name}: v${current} → v${next} (${bump})`);

run('git add package.json');
