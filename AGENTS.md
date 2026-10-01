# AGENTS.md

Working agreement for this repository.

## Git workflow (required)

**Build first, then push the full updated code.**

Before every push:

1. Run the type-check on both sides:
   - `backend/` → `node node_modules/typescript/bin/tsc --noEmit`
   - `frontend/` → `node node_modules/typescript/bin/tsc --noEmit`
2. Build the frontend:
   - `frontend/` → `node node_modules/vite/bin/vite.js build`
3. Confirm it succeeded, then stage and commit.

Rules:

- **Never push a single file or a partial change.** Always commit the complete
  set of changes for the task so the remote is a working snapshot.
- Stage the whole working tree (`git add -A` / `git add .`) rather than
  hand-picking paths, unless an unrelated change in the tree genuinely belongs
  to someone else — in that case say so explicitly instead of pushing it.
- Verify the tree is clean and synced after pushing:
  `git status --short` (empty) and `git rev-list --left-right --count origin/main...HEAD` → `0 0`.
- Do not commit `.env`, secrets, API keys, or tokens.
- Do not force-push `main`.

## Project layout

- `frontend/` — React + Vite + TypeScript + Tailwind. Build output (`dist/`) is
  gitignored; deployment builds from source.
- `backend/` — Express + TypeScript + MongoDB. Source only; no build output is
  committed.

## Verification

Prefer proving a change against a live server or a rendered component rather
than reasoning alone. Remove any temporary test scripts before committing.
