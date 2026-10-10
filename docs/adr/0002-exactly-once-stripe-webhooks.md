# ADR-0002: Exactly-once processing of Stripe webhooks

- Status: accepted
- Date: 2026-10-09

## Context

Stripe delivers webhooks at least once and retries on any non-2xx. The original handler was idempotent only because `completeSelfServeSignup` returns early if a customer already exists for the user. That protects this one event type, by coincidence of its data shape. Any future handler (subscription updated, payment failed) would need its own ad-hoc guard.

## Decision

Add `ProcessedStripeEvent(id = Stripe event id)`. `processStripeEventOnce(event, apply)` inserts the marker and runs `apply` **in one transaction**:

- Redelivery → primary-key violation (P2002) → `duplicate` → 200, nothing re-run.
- `apply` throws → the marker rolls back with it → non-2xx → Stripe retries cleanly.
- Validation failures (missing session data, unknown tier, user not yet synced) return before the transaction, so no marker is written and Stripe's retry gets another chance.

## Consequences

- Every future event handler gets exactly-once semantics by wrapping `apply`.
- One extra table and one insert per event.
- Requires migration `20261009000000_processed_stripe_events`.
