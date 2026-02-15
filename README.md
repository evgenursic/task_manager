# Taskflow

Taskflow is a production-style task manager built with Next.js App Router, Prisma, and shadcn/ui.

## What the app does

- Create, edit, delete, and complete tasks
- Task fields: `title`, `notes`, `dueAt`, `priority`, `status`, `createdAt`, `updatedAt`
- Filters: `All`, `Today`, `This Week`, `Overdue`, `Done`
- Search by title/notes and sort by due date, priority, or created date
- Dedicated `Due soon` section (next 24 hours) and strong overdue indicators
- In-app reminders panel (overdue count, due today count, next upcoming task)
- Daily email digest endpoint for cron jobs (Resend)
- Dark mode, keyboard shortcuts, and accessibility-focused UI

## Tech stack

- Next.js (App Router, JavaScript + JSDoc)
- Tailwind CSS + shadcn/ui
- Prisma ORM
- SQLite for local development (can be switched to Postgres/Neon for deployment)
- Vitest (unit tests)
- Playwright (end-to-end tests)
- GitHub Actions (CI + scheduled daily reminder)

## Local setup

1. Install dependencies:

```bash
corepack pnpm install
```

2. Create local env file:

```bash
cp .env.example .env
```

3. Apply Prisma migrations:

```bash
corepack pnpm db:migrate
```

4. Optional: seed sample tasks:

```bash
corepack pnpm db:seed
```

5. Start dev server:

```bash
corepack pnpm dev
```

6. Open `http://localhost:3000/tasks`.

## Database and migrations

- Create/apply a migration:

```bash
corepack pnpm db:migrate
```

- Generate Prisma client:

```bash
corepack pnpm db:generate
```

- Open Prisma Studio:

```bash
corepack pnpm db:studio
```

For production with Postgres/Neon, set `DATABASE_URL` to your Neon connection string and run Prisma migrations in your deploy pipeline.

## Running tests

- Lint:

```bash
corepack pnpm lint
```

- Format check:

```bash
corepack pnpm format:check
```

- Unit tests:

```bash
corepack pnpm test
```

- E2E tests:

```bash
corepack pnpm e2e
```

- CI-like full verification:

```bash
corepack pnpm lint
corepack pnpm format:check
corepack pnpm test:ci
corepack pnpm e2e:ci
corepack pnpm build
```

## Cron reminders setup (Resend + GitHub Actions)

### 1) Configure application env vars

Set these in your deployment environment (for example Vercel project settings):

- `CRON_SECRET`
- `REMINDER_EMAIL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (optional, default: `Taskflow <onboarding@resend.dev>`)

### 2) Configure GitHub repository secrets

In GitHub repository settings (`Settings` -> `Secrets and variables` -> `Actions`), add:

- `APP_CRON_URL` (your deployed base URL, for example `https://your-app.vercel.app`)
- `CRON_SECRET` (must match deployed app `CRON_SECRET` exactly)

Workflow file: `.github/workflows/daily-reminder.yml`

- Scheduled to trigger around 08:00 Europe/Ljubljana with DST-safe guard
- Supports manual run via `workflow_dispatch`

### 3) Test endpoint manually

```bash
curl -X POST http://localhost:3000/api/cron/daily-reminder \
  -H "X-CRON-SECRET: your-secret"
```

Expected response includes `ok` and reminder counts.

## Troubleshooting

- `Missing required env vars` from `/api/cron/daily-reminder`:
  - Verify `CRON_SECRET`, `REMINDER_EMAIL`, and `RESEND_API_KEY` are set.
- `Unauthorized cron request`:
  - `X-CRON-SECRET` does not match app `CRON_SECRET`.
- Playwright failures on first run:
  - Install browser deps: `corepack pnpm exec playwright install --with-deps chromium`.
- Prisma errors (`P1001`, connection issues):
  - Check `DATABASE_URL` and DB availability.
- Formatting check fails:
  - Run `corepack pnpm format:write` and commit formatted files.

## Deployment notes

- CI workflow: `.github/workflows/ci.yml` (lint, format check, unit, e2e, build)
- Daily reminder workflow: `.github/workflows/daily-reminder.yml`
- Keep secrets only in deployment provider and GitHub secrets, never in repo files.

## Screenshots

Add screenshots here after deployment:

- `docs/screenshots/tasks-list.png`
- `docs/screenshots/new-task-dialog.png`
- `docs/screenshots/reminders-panel.png`
