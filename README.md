# @freetison/bump-version

Auto-bump `package.json` version from **Conventional Commits** — zero dependencies, designed for **husky pre-commit** hooks.

## Why a separate package?

`bump-version` runs synchronously inside `git commit`. It needs to be **fast** and **lightweight** (zero deps, only Node.js built-ins). Mixing it with AI-commit tools like `git-super` would add unnecessary startup overhead to every single commit.

If the repo has **no `package.json`** (Python, Docker-only, etc.) the tool exits silently with code 0 — nothing to bump.

## Install

```bash
# Global (recommended — works for ALL repos, no per-repo changes needed)
npm install -g @freetison/bump-version
```

```bash
# Per-project devDep (alternative, only for JS/TS repos)
pnpm add -D @freetison/bump-version
```

## Husky setup

```bash
# .husky/pre-commit
bump-version
npx lint-staged
```

## Bump rules (Conventional Commits)

| Commit pattern | Bump |
|---|---|
| `feat!:` / `fix!:` / `refactor!:` / `BREAKING CHANGE` | `major` |
| `feat:` / `feat(scope):` | `minor` |
| anything else (`fix:`, `chore:`, `docs:`, …) | `patch` |

Skips automatically when:
- On `BASE_BRANCH` (default: `main`)
- No commits ahead of base branch
- No `package.json` in current directory (non-JS repos)

## Usage

```bash
bump-version               # auto-detect + update package.json + git add
bump-version --dry-run     # print what would happen, no changes
bump-version --verbose     # extra debug output
BASE_BRANCH=develop bump-version  # compare against develop
```

## Environment

| Variable | Default | Description |
|---|---|---|
| `BASE_BRANCH` | `main` | Branch to compare commits against |
