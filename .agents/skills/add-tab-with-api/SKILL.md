---
name: add-tab-with-api
description: Add or update a section, tab, or page in the tg-birthdays Angular mini app when the feature may require backend support. Use when Codex must introduce a new client surface in `apps/client` and decide whether to reuse an API or add a dedicated endpoint in `apps/bot/src/web-api.ts`, especially for filtered, sorted, aggregated, or optimized datasets.
---

# Add Tab With API

Create the UI surface in `apps/client/src/app` and check the existing route, nav strip, and adjacent pages before choosing structure or style.

When the new section needs data, inspect `apps/client/src/app/core/backend-api.service.ts`, `apps/bot/src/web-api.ts`, and `libs/shared-types/src/index.ts` together before writing code.

Prefer reusing an existing backend endpoint only when all of these are true:

- The endpoint already returns the exact dataset shape the view needs.
- The endpoint already supports the required ordering and filtering.
- The client does not need to iterate every page or overfetch unrelated records.

Add or adjust a backend API when any of these are true:

- The new tab needs a derived subset such as "upcoming", "recent", "top", "duplicates", or "needs review".
- The view needs server-side ordering, filtering, aggregation, or summaries that do not match the generic list endpoint.
- Using the current API would require fetching every page client-side just to filter locally.
- The same dataset is likely to be reused by more than one surface.

When adding the API:

- Put the route in `apps/bot/src/web-api.ts`.
- Keep the contract in `libs/shared-types/src/index.ts`.
- Add a typed method in `apps/client/src/app/core/backend-api.service.ts`.
- Keep the client page focused on presentation and simple UI-only formatting.

For contact-based views in this repo:

- Treat `/contacts` as a generic paginated archive endpoint.
- Do not use `/contacts` as a transport for specialized views by crawling all pages in Angular.
- Introduce a dedicated endpoint such as `/contacts/upcoming` when the view has its own selection or sort semantics.

Preserve the visual language of neighboring pages instead of inventing a new design system.

Validate at minimum:

1. `npx tsc -b`
2. `npm run bot:build` when backend or shared types change
3. `npm run app:build` when client or shared types change
