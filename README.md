# @freetison/bump-version

Auto-bump `package.json` version from **Conventional Commits** — zero dependencies, designed for **husky pre-commit** hooks.

## Why a separate package?

`bump-version` runs synchronously inside `git commit`, before the commit object exists. It needs to be **fast** and **lightweight** (zero deps, only Node.js built-ins). Mixing it with AI-commit tools like `git-super` would add unnecessary startup overhead to every single commit.

## Install

```bash
# per-project (recommended — ends up in node_modules/.bin)
npm install -D @freetison/bump-version
# or
pnpm add -D @freetison/bump-version
```

```bash
# global
npm install -g @freetison/bump-version
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
