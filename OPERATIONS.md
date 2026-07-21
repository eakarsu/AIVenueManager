# Operations

Copy `.env.example` to `.env`, replace placeholders, provision PostgreSQL and dependencies, then run `npm run migrate`. Start with `./start.sh`.

Startup is non-mutating and fails closed on missing secrets/schema. Run `npm test`. Ticketing/payment/tax/messaging/accounting delivery rows do not claim Eventbrite, Ticketmaster, or another live provider; an adapter must persist a verified acknowledgement. Preserve append-only audit data and exercise cancellation, partial fulfillment, refund, retry, and dead-letter recovery before production use.

The legacy force-sync seed is destructive and guarded by `ALLOW_DESTRUCTIVE_DEMO_SEED=true`; use it only for an isolated disposable database.
