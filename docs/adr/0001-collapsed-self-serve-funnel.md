# ADR-0001: Self-serve checkout that still records the documented sales funnel

- Status: accepted
- Date: 2026-08-06 (written up 2026-10-09)

## Context

The documented customer lifecycle is sales-assisted: `LEAD → QUALIFIED_LEAD → DISCOVERY_CALL_SCHEDULED → … → PAYMENT_RECEIVED → ACCOUNT_CREATED`. Building the discovery-call and proposal tooling first would delay the first paying customer by weeks. Skipping straight to `ACCOUNT_CREATED` would leave the lifecycle data inconsistent: funnel reports would show customers who were never leads.

## Decision

Phase 1 sells one tier through Stripe Checkout. When payment completes, the system creates the customer at `ACCOUNT_CREATED` **and writes one ActivityLog transition for every intermediate funnel state, in order, attributed to `SYSTEM`**, inside the same transaction.

## Consequences

- First revenue doesn't wait for sales tooling.
- Funnel analytics stay structurally valid. Self-serve customers are identifiable by `actorLabel = SYSTEM` and the note on the final transition.
- When the sales-assisted path ships, both paths produce the same history shape.
- Cost: nine log rows per signup. Negligible.
