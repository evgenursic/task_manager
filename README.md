# Task Manager

Milestone 0 scaffold for a task manager app built with:

- Next.js (App Router, JavaScript)
- Tailwind CSS
- shadcn/ui foundation
- Dark mode via `next-themes`
- ESLint + Prettier

## Local setup

1. Install dependencies:

```bash
corepack pnpm install
```

2. Start the development server:

```bash
corepack pnpm dev
```

3. Copy env template:

```bash
cp .env.example .env
```

4. Create local SQLite DB and apply migration:

```bash
corepack pnpm db:migrate
```

5. (Optional) Seed sample tasks:

```bash
corepack pnpm db:seed
```

6. Open `http://localhost:3000` (root redirects to `/tasks`).

## Scripts

- `corepack pnpm dev` - Start development server.
- `corepack pnpm build` - Build production bundle.
- `corepack pnpm start` - Run production server.
- `corepack pnpm lint` - Run ESLint.
- `corepack pnpm format` - Check Prettier formatting.
- `corepack pnpm format:write` - Apply Prettier formatting.
- `corepack pnpm db:migrate` - Run Prisma migrations.
- `corepack pnpm db:generate` - Generate Prisma client.
- `corepack pnpm db:studio` - Open Prisma Studio.
- `corepack pnpm db:seed` - Seed sample data.

## Direct Prisma CLI

- `corepack pnpm prisma migrate dev`
- `corepack pnpm prisma studio`

## Current routes

- `/` -> redirects to `/tasks`
- `/tasks` -> task dashboard UI foundation with filters/sorting
- `/api/cron/daily-reminder` -> secured cron endpoint for daily reminder email

## Daily Reminder Endpoint

Required environment variables:

- `CRON_SECRET`
- `REMINDER_EMAIL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (optional; defaults to `Taskflow <onboarding@resend.dev>`)

Manual local call example:

```bash
curl -X POST http://localhost:3000/api/cron/daily-reminder \
  -H "X-CRON-SECRET: your-secret"
```
