# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server (Next.js on localhost:3000)
bun run build    # Production build
bun run lint     # ESLint
bunx drizzle-kit push    # Push schema changes to database
bunx drizzle-kit generate  # Generate migration files
```

No test suite is configured.

## Environment

Requires `.env.local` with: `DATABASE_URL`, `TALO_CLIENT_ID`, `TALO_CLIENT_SECRET`, `TALO_USER_ID`, `TALO_ENVIRONMENT`, `NEXT_PUBLIC_APP_URL`.

## Architecture

**Multi-game Talo Pay showcase** — interactive games demonstrating Talo Pay capabilities. Spanish-language UI (es-AR locale). Built with Next.js 16 (App Router), React 19, Drizzle ORM, PostgreSQL, and the Talo Pay SDK.

### Route structure

- `/` — Home page with game selection grid
- `/horse-race` — Horse racing lobby (3D, Three.js)
- `/horse-race/race/[raceId]` — Individual horse race
- `/horse-race/register` — X handle registration
- `/ball-race` — Ball Race lobby (2D Canvas)
- `/ball-race/race/[raceId]` — Individual ball race
- `/api/races/` — Horse race API endpoints
- `/api/ball-race/` — Ball race API endpoints
- `/api/webhooks/talo` — Shared Talo webhook (routes by `external_id` prefix: `race_`, `ballrace_`, `register_`)

### Core flow (shared across games)

1. **Game creation** — POST to game API creates Talo payment with alias/CVU
2. **Payment** — Players transfer via Talo. Webhook confirms payment, assigns slot
3. **Race trigger** — When all slots filled, simulation runs server-side generating deterministic keyframes
4. **Playback** — Client plays back from keyframe data (Three.js for horses, Canvas for balls)
5. **Real-time updates** — SSE via global `EventEmitter` pushes `player_joined` and `race_finished`

### Games

**Horse Race** — 3D race with animated horse models. Sizes: 4, 6, 8, 10. Tables: `3drace_*`.
- Simulation: `src/lib/race-simulation.ts` (keyframes: progress + lateral offset + stumble)
- Rendering: `src/components/three/` (React Three Fiber)
- Lobby: `src/components/lobby/`

**Ball Race** — 2D ball drop through random obstacles (pegs, spinners, funnels, gaps). Sizes: 4, 8, 12, 16. Tables: `ballrace_*`.
- Simulation: `src/lib/ball-race-simulation.ts` (keyframes: x, y, rotation)
- Obstacles: `src/components/ball-race/ball-race-obstacles.ts` (seeded PRNG, shared between server/client)
- Rendering: `src/components/ball-race/ball-race-scene.tsx` (HTML Canvas)
- Lobby: `src/components/ball-race-lobby/`

### Shared infrastructure

- `src/lib/race-events.ts` — Global EventEmitter for SSE broadcasting (shared across games)
- `src/lib/use-race-stream.ts` — Client hook for SSE events
- `src/lib/talo.ts` — Singleton Talo Pay client
- `src/lib/seeded-random.ts` — Mulberry32 PRNG for deterministic obstacle generation
- `src/lib/db/schema.ts` — All DB tables (horse race, ball race, shared registrations)
- `src/app/api/webhooks/talo/route.ts` — Unified webhook handler for all games + registration
- `src/components/ui/` — shadcn/ui components

### Database

PostgreSQL via Drizzle ORM. Schema in `src/lib/db/schema.ts`.
- `3drace_races`, `3drace_slots` — Horse race data
- `3drace_leaderboard` — Horse race leaderboard
- `ballrace_races`, `ballrace_slots` — Ball race data
- `ballrace_leaderboard` — Ball race leaderboard
- `3drace_registrations` — Shared X handle registration (links CUIT to identity)

### Registration system

Players register their X (Twitter) handle via a one-time Talo payment. Links CUIT (Argentine tax ID) to identity. Shared across all games — registered players show their X avatar; unregistered show bank sender name initials.

## Important conventions

- This is a game, not a gambling/betting site. Avoid betting/gambling terminology.
- UI text is in Spanish (Argentina).
- `@/` path alias maps to `src/`.
- Uses bun as package manager (bun.lock present).
- Tailwind CSS v4 with CSS variables for theming (gold/green palette).
- shadcn/ui components in `src/components/ui/`.
- Each game has separate DB tables, API routes, lobby components, and leaderboard.
- Webhook routing uses `external_id` prefix convention: `race_`, `ballrace_`, `register_`.
