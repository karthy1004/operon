import "server-only";
import { prisma } from "@/lib/prisma";
import type { CustomerStatus, Prisma } from "@prisma/client";

/**
 * The canonical Customer Lifecycle (04-customer-journey §1) assumes a
 * sales-assisted, discovery-call-gated funnel. Phase 1 ships true
 * self-serve checkout instead (founder decision — see build plan). To stay
 * faithful to the documented state machine rather than silently skip it,
 * every intermediate state is still written to the Activity Log, just
 * completed atomically by the system instead of by a human.
 */
export const COLLAPSED_FUNNEL_STATES: CustomerStatus[] = [
  "LEAD",
  "QUALIFIED_LEAD",
  "DISCOVERY_CALL_SCHEDULED",
  "DISCOVERY_CALL_COMPLETED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "PROPOSAL_ACCEPTED",
  "PAYMENT_RECEIVED",
  "ACCOUNT_CREATED",
];

type SignupParams = {
  userId: string;
  tier: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

export async function completeSelfServeSignup(params: SignupParams) {
  return prisma.$transaction((tx) => completeSelfServeSignupTx(tx, params));
}

/** Same as completeSelfServeSignup, inside a caller-owned transaction. */
export async function completeSelfServeSignupTx(tx: Prisma.TransactionClient, params: SignupParams) {
  const { userId, tier, stripeCustomerId, stripeSubscriptionId } = params;

  const existing = await tx.customer.findUnique({ where: { userId } });
  if (existing) return existing; // idempotent — webhook may retry/replay

  const customer = await tx.customer.create({
    data: {
      userId,
      status: "ACCOUNT_CREATED",
      activeServicePlanTier: tier,
      approvalMode: "MODE_B_AUTO_SUBMIT",
      subscriptionStatus: "active",
      stripeCustomerId,
      stripeSubscriptionId,
    },
  });

  let previousState: string | null = null;
  for (const state of COLLAPSED_FUNNEL_STATES) {
    await tx.activityLog.create({
      data: {
        userId: null,
        actorLabel: "SYSTEM",
        action: "CUSTOMER_STATUS_TRANSITION",
        entityType: "Customer",
        entityId: customer.id,
        previousState,
        newState: state,
        notes:
          state === "ACCOUNT_CREATED"
            ? "Self-serve checkout completed via Stripe (Phase 1 collapsed funnel)"
            : null,
      },
    });
    previousState = state;
  }

  return customer;
}

export async function isSignupsPaused(): Promise<boolean> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: "signups_paused" },
  });
  return setting?.value === "true";
}
