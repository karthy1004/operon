import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { PRICING_TIERS } from "@/lib/stripe";

export default async function PricingPage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-10 text-center">
        <p className="font-display text-3xl text-pine-deep">Pricing</p>
        <p className="mt-2 text-ink-soft">
          A flat monthly subscription. Cancel anytime, as easily as you
          signed up.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PRICING_TIERS.map((t) => (
          <div
            key={t.tier}
            className="flex flex-col rounded-2xl border border-mist bg-card p-6"
          >
            <p className="text-xs uppercase tracking-wide text-sage">
              Tier {t.tier}
            </p>
            <p className="mt-2 font-mono text-3xl">
              {t.priceUsd ? `$${t.priceUsd}` : "—"}
              {t.priceUsd && (
                <span className="text-sm text-ink-soft">/mo</span>
              )}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {t.applicationsPerMonth} applications / month
            </p>
            <div className="mt-6">
              {t.available ? (
                <form action="/api/checkout" method="POST">
                  <input type="hidden" name="tier" value={t.tier} />
                  {userId ? (
                    <Button type="submit" className="w-full">
                      Choose plan
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href={`/sign-up?redirect_url=/pricing`}>
                        Sign up to choose plan
                      </Link>
                    </Button>
                  )}
                </form>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Contact us
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-sm text-ink-soft">
          Need a custom or enterprise plan?{" "}
          <a
            href="mailto:hello@operon.com"
            className="font-medium text-pine-deep underline"
          >
            Contact us
          </a>
          .
        </p>
      </div>
    </main>
  );
}
