
## Required final checks

Check the following after any major implementation or bug-fix. Your job is not done until the following are run and satisfied:
- Run a lint check
- Run `npm run build`
- If a required check is blocked by an unrelated pre-existing failure, call that out clearly instead of silently skipping it.

## Commits & Deployment

- Never make a commit unless the user gives explicit permission.
- Let the user do git add, etc, unless explicitly asked.
- When suggesting commit messages, use syntax like `feat: ...`, `style: ...`, `feat(Part): ...`, or `style(Part): ...`.
- Never deploy to Railway directly. Railway is synced to the git repo, so deploys should happen only from git commits and only with explicit user permission.

## Git and workspace safety

- ONLY work off main.
- Do not create worktrees unless the user explicitly says to do this.

## Local runtime

- Do not leave `next dev` or any other long-running local server/process running at the end of a task unless the user explicitly asks for it.
- If you start or take over a local dev server or other long-running verification process, stop it before ending your response unless the user explicitly asked you to leave it running, and mention the released port or command when relevant.
- Do not "pause" a local server with signals like `SIGSTOP` as a handoff mechanism; fully stop it instead unless the user explicitly asks for a pause.

## Databases and migrations

- You are ONLY allowed to make db migrations with `npx prisma migrate dev --name <migration_name>`, and regenerate the client with `npx prisma generate`, and absolutely nothing else.
- If `npx prisma migrate dev --name <migration_name>` fails because of migration drift, a modified migration, a reset prompt, or any other reason, stop immediately. Do not run it again unless the user explicitly gives permission. Explain the problem and ask the user what they want to run.
- Never run commands like `db push`, `migrate deploy`, `db pull`, or anything else without explicitly asking the user first.
- Treat existing Prisma migration files as immutable project history. Never delete, rename, rewrite, or otherwise modify files inside `prisma/migrations/` after they exist, even if a migration seems broken or out of sync.
- If migration history is inconsistent, stop and surface the issue instead of trying to repair it by changing old migration files yourself.
- Creating a brand-new migration the right way with `npx prisma migrate dev --name <migration_name>` is allowed once per change when schema work is actually needed.
