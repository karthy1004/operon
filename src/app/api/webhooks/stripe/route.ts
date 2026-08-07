import { getStripe } from "@/lib/stripe";
import { completeSelfServeSignup } from "@/lib/domain/customer";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const clerkUserId = session.client_reference_id;
    const tier = Number(session.metadata?.tier ?? 1);

    if (!clerkUserId || !session.customer || !session.subscription) {
      return new Response("Missing session data", { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) {
      return new Response("User not found — Clerk sync may be delayed", {
        status: 409,
      });
    }

    await completeSelfServeSignup({
      userId: user.id,
      tier,
      stripeCustomerId: String(session.customer),
      stripeSubscriptionId: String(session.subscription),
    });
  }

  return new Response("OK", { status: 200 });
}
