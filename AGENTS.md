# AGENTS.md

## Purpose

This repository is an Nx workspace for a Telegram birthday reminder product with two main apps:

- `apps/bot`: a TypeScript `grammy` bot plus an Express server that also exposes the backend API used by the web client.
- `apps/client`: an Angular Telegram Mini App for managing reminders, manual contacts, Google sync, and duplicate cleanup.

Supabase is the persistence layer, and Google Contacts sync is supported for importing birthdays.

## Workspace Layout

- `apps/bot/src/bot.ts`: main bot entrypoint, Express server bootstrap, scheduled HTTP routes, OAuth callback handling, and API route registration.
- `apps/bot/src/platform.ts`: shared bot bootstrap, `.env` loading, `grammy` session setup, and Supabase client initialization.
- `apps/bot/src/web-api.ts`: authenticated JSON API consumed by the client. Handles session bootstrap, contacts CRUD-ish flows, duplicate detection/merge, Google connect/sync/disconnect, and reminder settings.
- `apps/bot/src/google.ts`: Google OAuth, token refresh, People API sync, cooldown enforcement, and OAuth completion handoff back to the frontend popup.
- `apps/bot/src/requests/`: internal HTTP-triggered handlers for scheduled tasks.
- `apps/bot/src/schema.ts`: generated Supabase database types. Regenerate it; do not hand-edit unless explicitly required.
- `apps/client/src/app/`: Angular app shell, pages, routing, session store, Telegram WebApp integration, and backend API client.
- `libs/shared-types/src/index.ts`: shared DTOs used by both bot API and Angular client.
- `supabase/migrations/`: schema migrations. The current migration set adds Google sync metadata and normalized birthday columns.
- `scripts/google-backfill-birthdays.mjs`: one-off script for backfilling Google Contacts birthdays from manual Supabase entries.
- `dist/`: generated build output.
- `src/`: thin root shims that forward to the Angular client app. Do not mistake this for the primary application source tree.

## Runtime Model

- The bot and backend API are the same Node process.
- In development, `apps/bot/src/bot.ts` starts an Express server for OAuth/API routes and also starts Telegram polling with `bot.start()`.
- In production, the bot runs behind Express webhook handling at `Requests.telegramWebhook` instead of polling.
- Scheduled routes such as `/birthDaysOfTheDay` and `/testCron` are handled by the bot app, not by a separate worker.
- Interactive Telegram commands are no longer part of the product flow; the bot is now used for scheduled birthday reminders while user actions go through the Mini App frontend and `/api`.
- Scheduled reminder routes are protected in production by the `X-Cron-Secret` header backed by the `CRON_SECRET` environment variable.
- The Angular client talks to the bot backend under `/api`.
- Client authentication is based on Telegram Mini App `initData`, with a development fallback via `X-Dev-User-Id` or `?userId=...`.
- Supabase is initialized once in `apps/bot/src/platform.ts` and imported elsewhere.

## Commands

- Install dependencies: `npm install`
- Serve the bot locally: `npm run bot:serve`
- Build the bot: `npm run bot:build`
- Start the built bot: `npm run bot:start`
- Serve the Angular client locally: `npm run app:serve`
- Build the Angular client: `npm run app:build`
- Type-check the workspace: `npx tsc -b`
- Regenerate Supabase types for the bot: `npm run types`

## Environment

Core bot/backend variables:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `TELEGRAM_TOKEN`

Common local-development variables:

- `TELEGRAM_DEV_BOT_TOKEN`
- `NODE_ENV`
- `PORT`
- `CRON_SECRET` for local testing of scheduled HTTP routes

Google sync variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_OAUTH_STATE_SECRET` optional, otherwise the production Telegram token is reused as the signing secret

Script-only variables for `scripts/google-backfill-birthdays.mjs`:

- `TARGET_USER_ID`
- `GOOGLE_OAUTH_PORT` optional, defaults to `8787`
- `REPORT_PATH` optional

Notes:

- Missing `SUPABASE_URL` or `SUPABASE_KEY` breaks both Telegram flows and API routes.
- In non-production mode the bot prefers `TELEGRAM_DEV_BOT_TOKEN`, then falls back to `TELEGRAM_TOKEN`.
- The client chooses `http://localhost:3000` on localhost and otherwise defaults to the deployed Cloud Run backend unless `window.__TG_BDAYS_API_URL__` is injected at runtime.

### Secret Placement

- Root `.env` file for local bot/backend development:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `TELEGRAM_TOKEN`
  - `TELEGRAM_DEV_BOT_TOKEN`
  - `CRON_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
  - `GOOGLE_OAUTH_STATE_SECRET` if you want an explicit state-signing secret locally
  - `NODE_ENV`
  - `PORT`
- Cloud Run service runtime environment for production bot/backend:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `TELEGRAM_TOKEN`
  - `CRON_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
  - `GOOGLE_OAUTH_STATE_SECRET` optional; if omitted, the app falls back to `TELEGRAM_TOKEN`
  - `NODE_ENV`
  - `PORT`
- GitHub Actions repository secrets for the frontend release workflow:
  - `NETLIFY_AUTH_TOKEN`
  - `NETLIFY_SITE_ID`
- Script-only environment variables for `scripts/google-backfill-birthdays.mjs`:
  - `TARGET_USER_ID`
  - `GOOGLE_OAUTH_PORT`
  - `REPORT_PATH`
- The Angular client does not read secrets from its own `.env` file. If the frontend needs a runtime API override, inject `window.__TG_BDAYS_API_URL__` at runtime rather than adding a client secret.

## Deployment Shape

- The bot/backend is containerized with `Dockerfile` and deployed through `cloudbuild.yaml` to Google Cloud Run.
- The client is built separately and configured for Netlify via `netlify.toml`.
- Daily reminder delivery is triggered by Google Cloud Scheduler calling the backend scheduled route.
- The Netlify site is expected to be unlinked from Git-based continuous deployment.
- Frontend production deploys ship through the tag-driven GitHub Actions workflow in `.github/workflows/deploy-frontend.yml`, which builds `apps/client` and uploads `dist/apps/client/browser` to Netlify with the CLI.
- The frontend release workflow requires GitHub secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`.
- The Docker image only builds and runs the bot app; the Angular client is not served from the container.

## Coding Notes

- Make source changes in `apps/bot`, `apps/client`, `libs/shared-types`, `supabase`, or `scripts` as appropriate.
- Treat `dist/` as generated output unless the task explicitly asks for build artifacts.
- Prefer reusing `Requests`, `MyContext`, and shared DTOs from `libs/shared-types` instead of duplicating literals or response shapes.
- If an API contract changes, update both `apps/bot/src/web-api.ts` and the relevant client usage in `apps/client/src/app`.
- If shared request/response shapes change, update `libs/shared-types/src/index.ts` and then fix both sides.
- If a new client section needs a filtered, sorted, or aggregated dataset that does not match an existing paginated endpoint, add or adjust a backend API for that view instead of fetching every page client-side.
- If database shape changes, update the Supabase schema/migration first and then regenerate `apps/bot/src/schema.ts`.
- Keep scheduled reminder behavior and web API behavior aligned when they share the same underlying feature, especially Google sync and reminder state.
- The repo mixes quote styles between the bot and the Angular client. Preserve nearby style rather than reformatting broadly.
- There are no meaningful automated tests configured right now; validation is mostly build/typecheck plus targeted manual runs.

## Validation

For most code changes, the minimum useful validation is:

1. `npx tsc -b`
2. `npm run bot:build` if bot or shared types changed
3. `npm run app:build` if client or shared types changed

If behavior changed materially, also run the affected app locally with valid environment variables:

- `npm run bot:serve` for Telegram/API/backend changes
- `npm run app:serve` for Mini App changes

## Agent Guidance

- Check existing conventions in the touched app before refactoring; the bot and Angular client do not follow identical style choices.
- Do not remove or rewrite unrelated generated files unless explicitly asked.
- Avoid hardcoding new chat IDs, Telegram user IDs, API URLs, or secrets without a clear request.
- Update `AGENTS.md` in the same patch whenever repo structure, runtime model, deployment flow, secrets placement, or primary product flows change.
- Update `README.md` in the same patch whenever repo structure, runtime model, deployment flow, secrets placement, or primary product flows change.
- If a task removes, replaces, or significantly changes commands, routes, auth flows, or ownership between bot/backend/frontend, reflect that change in the relevant `AGENTS.md` section before considering the task complete.
- If a task removes, replaces, or significantly changes commands, routes, auth flows, deployment, or ownership between bot/backend/frontend, reflect that change in the relevant `README.md` section before considering the task complete.
- If a task touches shared types, verify both the bot API and Angular client compile against the change.
- If a task touches Google sync, inspect both `apps/bot/src/google.ts` and the client surfaces that call it.
- If a task touches birthday reminders, verify both the scheduled request path and the frontend/API state because the same backend owns both.
- `scripts/` is currently untracked in git on this checkout. Be careful not to overwrite user changes there.
