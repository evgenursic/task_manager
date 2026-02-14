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

3. Open `http://localhost:3000` (root redirects to `/tasks`).

## Scripts

- `corepack pnpm dev` - Start development server.
- `corepack pnpm build` - Build production bundle.
- `corepack pnpm start` - Run production server.
- `corepack pnpm lint` - Run ESLint.
- `corepack pnpm format` - Check Prettier formatting.
- `corepack pnpm format:write` - Apply Prettier formatting.

## Current routes

- `/` -> redirects to `/tasks`
- `/tasks` -> placeholder task page for the next milestone
