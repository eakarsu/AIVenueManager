# Audit Recommendations & Status — AIVenueManager

Source: /Users/erolakarsu/projects/_AUDIT/reports/batch_08.md (section 26)

Verdict per audit: template-clone, 0 AI endpoints despite the AI-prefixed name.

## Original audit recommendations

Missing AI:
- Dynamic pricing based on demand
- Artist/audience matching

Missing non-AI:
- Ticketing platform integrations (Eventbrite, Ticketmaster)
- Payment processing
- Marketing automation
- Customer self-service portal

Custom feature ideas:
- Dynamic pricing optimizer
- Artist/audience matcher
- Revenue prediction
- Scheduling optimizer (cannibalization)
- Marketing campaign recommender

## Implemented in this pass (MECHANICAL)

Created `server/routes/ai.js` and registered under `/api/ai` in `server/index.js`. Reuses `callOpenRouter` and `aiRateLimiter`. Persists to `ai_results` (table is created at startup in `index.js`).

- `POST /api/ai/dynamic-pricing` — ticket-price recommendations.
- `POST /api/ai/revenue-forecast` — event revenue forecast with confidence + ranges.
- `POST /api/ai/artist-audience-match` — artist/audience fit score with drivers.

## Backlog

1. Scheduling optimizer (multi-event cannibalization) — needs richer data.
2. Marketing campaign recommender — could be added similarly; keep as next mechanical step.
3. Ticketing platform integrations — credentials decision.
4. Payment processing — credentials decision.
5. Customer self-service portal — substantial frontend work.

## Apply pass 5 (all backlog)

Implemented the remaining backlog as additive endpoints + FE pages, with env-var gating.

- **`POST /api/ai/scheduling-optimizer`** (NEEDS-PRODUCT-DECISION) — Multi-event cannibalization / lineup balancing. PRODUCT-DECISION: 14-day cannibalization window default; recommendations only — no auto-rescheduling.
- **`POST /api/ai/eventbrite-sync`** (NEEDS-CREDS) — Push/pull events. Gated on `EVENTBRITE_API_TOKEN` (returns 503 + `missing: EVENTBRITE_API_TOKEN` when unset). Stub implementation prepares payload preview — no live API call (avoiding npm install of `eventbrite` SDK).
- **`POST /api/ai/stripe-payment-intent`** (NEEDS-CREDS) — Create payment intent for ticket purchase. Gated on `STRIPE_SECRET_KEY` (returns 503 + `missing: STRIPE_SECRET_KEY` when unset). PRODUCT-DECISION: returns a stub intent ID rather than pulling in the heavy `stripe` SDK (no npm install rule).

**FE pages** (new): `client/src/pages/AISchedulingOptimizerPage.js`, `EventbriteSyncPage.js`, `StripePaymentPage.js`. Routes added to `client/src/App.js` (`/ai/scheduling-optimizer`, `/integrations/eventbrite`, `/integrations/stripe-payment`). Nav links added in `client/src/components/Layout.js` (Scheduling under "New AI Tools"; Eventbrite + Stripe under new "Integrations" section).

**Smoke test:** pkill ports → start `server/index.js` → login `admin@venue.com / password123` → 503 paths verified for all 3 (`OPENROUTER_API_KEY` placeholder, `EVENTBRITE_API_TOKEN` unset, `STRIPE_SECRET_KEY` unset). Cleanup OK.

**Constraints:** No npm install. Additive routes/pages only — no existing endpoints touched. Capped at 3 features (well under 10/project cap).

## Apply pass 4 (mechanical backlog)

Implemented the next MECHANICAL backlog item (#2):

- **`POST /api/ai/marketing-campaign-recommender`** (added to `server/routes/ai.js`) — recommends channel mix, budget allocation, creative themes, and KPIs. Reuses `callOpenRouter`, `authMiddleware`, `aiRateLimiter`, `persist()` to `ai_results`. Explicit 503 when `OPENROUTER_API_KEY` is missing/placeholder.
- **FE: `client/src/pages/AIMarketingCampaignPage.js`** — form with audience/budget/channels/days-until-event, JWT via shared `api` client (interceptor handles 401), 503-aware error message.
- Wired route `/ai/marketing-campaign` in `client/src/App.js` and a `Marketing Campaign` link under "New AI Tools" in `client/src/components/Layout.js`.

Smoke-tested: pkill ports → start `server/index.js` → login (`admin@venue.com`/`password123`) → `curl POST /api/ai/marketing-campaign-recommender` returns `503 {"error":"AI service unavailable..."}` with no key configured. Cleanup OK.

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS — FE already wired.

The 3 pass-2 backend endpoints (`/ai/dynamic-pricing`, `/ai/revenue-forecast`, `/ai/artist-audience-match`) already have matching FE pages: `AIDynamicPricingPage.js`, `AIRevenueForecastPage.js`, `AIArtistAudienceMatchPage.js`. They are imported and routed in `client/src/App.js` (`/ai/dynamic-pricing`, `/ai/revenue-forecast`, `/ai/artist-match`) and surfaced in `client/src/components/Layout.js` under the "New AI Tools" navigation section. Each page POSTs to the matching backend endpoint via the shared axios `api` client (which carries the JWT). No FE changes needed.
