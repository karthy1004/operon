import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Approval Engine (04-customer-journey §6, Mode A). Only a customer
 * approving their own application should ever call this — callers must
 * verify ownership before invoking (see the server action in
 * dashboard-actions.ts, which scopes by the authenticated customer).
 */
export async function approveApplication(applicationId: string, actorUserId: string) {
  return prisma.$transaction(async (tx) => {
    const app = await tx.application.findUniqueOrThrow({ where: { id: applicationId } });

    const updated = await tx.application.update({
      where: { id: applicationId },
      data: {
        approvalStatus: "APPROVED",
        approvalDate: new Date(),
        status: "READY_FOR_SUBMISSION",
      },
    });

    await tx.activityLog.create({
      data: {
        userId: actorUserId,
        actorLabel: "CUSTOMER",
        action: "APPLICATION_APPROVED",
        entityType: "Application",
        entityId: applicationId,
        previousState: app.status,
        newState: updated.status,
      },
    });

    return updated;
  });
}

export async function requestApplicationChanges(
  applicationId: string,
  actorUserId: string,
  comment: string
) {
  return prisma.$transaction(async (tx) => {
    const app = await tx.application.findUniqueOrThrow({ where: { id: applicationId } });

    const updated = await tx.application.update({
      where: { id: applicationId },
      data: {
        approvalStatus: "CHANGES_REQUESTED",
        customerComments: comment,
        status: "PREPARING",
      },
    });

    await tx.activityLog.create({
      data: {
        userId: actorUserId,
        actorLabel: "CUSTOMER",
        action: "APPLICATION_CHANGES_REQUESTED",
        entityType: "Application",
        entityId: applicationId,
        previousState: app.status,
        newState: updated.status,
        notes: comment,
      },
    });

    return updated;
  });
}
