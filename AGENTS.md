# AGENTS.md

## Purpose

This repository contains a small TypeScript Telegram bot for birthday reminders. The bot uses `grammy` for Telegram interactions, `express` for production webhook handling, and Supabase for persistence.

## Project Layout

- `src/bot.ts`: main entrypoint, bot setup, command registration, Supabase client setup, and production webhook server.
- `src/commands/`: Telegram command handlers and conversation flows.
- `src/requests/`: HTTP-triggered handlers for scheduled tasks.
- `src/utils.ts`: shared helpers for admin checks, birthday message building, and keyboard generation.
- `src/enums.ts`: shared enums, command names, request paths, admin IDs, and user-facing messages.
- `src/schema.ts`: generated Supabase database types. Prefer regenerating this file instead of editing it manually.
- `dist/`: compiled JavaScript output from TypeScript sources.
- `apphosting.yaml`: hosting environment variable declarations.

## Runtime Model

- In development, the bot starts with `bot.start()` and runs as a polling bot.
- In production, the app starts an Express server, handles internal POST routes, and mounts the Telegram webhook callback.
- Supabase is initialized once in `src/bot.ts` and imported where needed.

## Commands

- Install dependencies: `npm install`
- Local build and run: `npm run local`
- Run compiled app: `npm run start`
- Rebuild TypeScript: `npx tsc`
- Regenerate Supabase types: `npm run types`

## Environment

Expected environment variables are declared in `apphosting.yaml`:

- `TELEGRAM_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PSW`
- `SUPABASE_ID`

The bot cannot start correctly without at least `TELEGRAM_TOKEN`, `SUPABASE_URL`, and `SUPABASE_KEY`.

## Coding Notes

- Keep source changes in `src/`. Treat `dist/` as generated output unless the task explicitly requires updating build artifacts.
- Preserve the existing TypeScript style in the touched file. The codebase currently mixes quote styles, so avoid broad formatting churn.
- Reuse `MyContext`, `Commands`, `Requests`, and shared helpers rather than duplicating literals.
- When changing database shapes, update the Supabase schema first and then regenerate `src/schema.ts`.
- Prefer small, focused handlers. Command modules are already split by feature and should stay that way.

## Validation

For most code changes, the minimum useful validation is:

1. `npx tsc`
2. If behavior changed materially, run `npm run local` with valid environment variables

## Agent Guidance

- Check for existing conventions in nearby files before refactoring.
- Do not remove or rewrite unrelated generated files unless explicitly asked.
- Avoid hardcoding new chat IDs, user IDs, or secrets without a clear request.
- If a task touches Telegram command behavior and scheduled requests, verify both code paths because they are initialized from the same entrypoint.
