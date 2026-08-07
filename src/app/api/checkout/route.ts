import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe, PRICING_TIERS } from "@/lib/stripe";
import { isSignupsPaused } from "@/lib/domain/customer";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.redirect(new URL("/sign-up", req.url));
  }

  if (await isSignupsPaused()) {
    return NextResponse.redirect(new URL("/signups-paused", req.url));
  }

  const form = await req.formData();
  const tier = Number(form.get("tier"));
  const tierConfig = PRICING_TIERS.find((t) => t.tier === tier);

  if (!tierConfig || !tierConfig.available) {
    return NextResponse.json(
      { error: "This tier isn't available for self-serve checkout yet." },
      { status: 400 }
    );
  }

  const priceId = process.env[tierConfig.stripePriceEnvVar];
  if (!priceId) {
    return NextResponse.json(
      {
        error: `Stripe price ID not configured (${tierConfig.stripePriceEnvVar}). Create the product/price in the Stripe dashboard (test mode) and set this env var.`,
      },
      { status: 500 }
    );
  }

  // Ensures our local User row exists before Stripe's webhook needs to
  // find it — the webhook only does a plain lookup, not a lazy create.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-up", req.url));
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: { userId: user.id },
  });
  if (existingCustomer?.stripeSubscriptionId) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: clerkUserId,
    metadata: { clerkUserId: clerkUserId, tier: String(tier) },
    success_url: `${new URL(req.url).origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${new URL(req.url).origin}/checkout/canceled`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe did not return a checkout URL." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
