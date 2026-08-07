import "server-only";
import Stripe from "stripe";

// Guarded lazy init — importing this module must never throw, since it's
// pulled in by routes that need to build/type-check even before Stripe
// keys exist. Only throws if actually invoked without a key configured.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — Stripe test-mode keys are required to use checkout."
    );
  }
  _stripe = new Stripe(key);
  return _stripe;
}

// Pricing per 01-business-model-and-scope.md. Only Tier 1 has a confirmed
// price; Tiers 2-4 are documented as TBD, so they're not sold through
// self-serve checkout yet — shown as "Contact us" on the pricing page.
export const PRICING_TIERS = [
  {
    tier: 1,
    applicationsPerMonth: 150,
    priceUsd: 699,
    stripePriceEnvVar: "STRIPE_PRICE_TIER_1",
    available: true,
  },
  { tier: 2, applicationsPerMonth: 225, priceUsd: null, available: false },
  { tier: 3, applicationsPerMonth: 300, priceUsd: null, available: false },
  { tier: 4, applicationsPerMonth: 400, priceUsd: null, available: false },
] as const;
