import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type StripeEventOutcome = "processed" | "duplicate";

/**
 * Runs `apply` for a Stripe event exactly once.
 *
 * The ProcessedStripeEvent row and the event's side effects commit in one
 * transaction. A redelivered event hits the primary key (P2002) and is
 * acknowledged as a duplicate. If `apply` throws, the marker rolls back with
 * everything else, so Stripe's retry gets a clean second attempt.
 */
export async function processStripeEventOnce(
  event: { id: string; type: string },
  apply: (tx: Prisma.TransactionClient) => Promise<void>
): Promise<StripeEventOutcome> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.processedStripeEvent.create({ data: { id: event.id, type: event.type } });
      await apply(tx);
    });
    return "processed";
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return "duplicate";
    }
    throw err;
  }
}
