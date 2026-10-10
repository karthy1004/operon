import "server-only";
import { prisma } from "@/lib/prisma";
import {
  ApprovalNotAllowedError,
  assertAwaitingCustomerApproval,
  normaliseComment,
} from "@/lib/domain/application-rules";

/**
 * Approval Engine (04-customer-journey §6, Mode A). Only a customer
 * approving their own application should ever call this — callers must
 * verify ownership before invoking (see the server action in
 * dashboard/actions.ts, which scopes by the authenticated customer).
 *
 * Both actions are only legal from WAITING_APPROVAL / PENDING. The update is
 * conditional on that state (compare-and-set), so two tabs clicking at once —
 * or a stale page — can't double-transition the application.
 */
const AWAITING = { status: "WAITING_APPROVAL", approvalStatus: "PENDING" } as const;

export async function approveApplication(applicationId: string, actorUserId: string) {
  return prisma.$transaction(async (tx) => {
    const app = await tx.application.findUniqueOrThrow({ where: { id: applicationId } });
    assertAwaitingCustomerApproval(app);

    const { count } = await tx.application.updateMany({
      where: { id: applicationId, ...AWAITING },
      data: {
        approvalStatus: "APPROVED",
        approvalDate: new Date(),
        status: "READY_FOR_SUBMISSION",
      },
    });
    if (count === 0) throw new ApprovalNotAllowedError(app.status, app.approvalStatus);

    await tx.activityLog.create({
      data: {
        userId: actorUserId,
        actorLabel: "CUSTOMER",
        action: "APPLICATION_APPROVED",
        entityType: "Application",
        entityId: applicationId,
        previousState: app.status,
        newState: "READY_FOR_SUBMISSION",
      },
    });

    return tx.application.findUniqueOrThrow({ where: { id: applicationId } });
  });
}

export async function requestApplicationChanges(
  applicationId: string,
  actorUserId: string,
  comment: string
) {
  const note = normaliseComment(comment);
  return prisma.$transaction(async (tx) => {
    const app = await tx.application.findUniqueOrThrow({ where: { id: applicationId } });
    assertAwaitingCustomerApproval(app);

    const { count } = await tx.application.updateMany({
      where: { id: applicationId, ...AWAITING },
      data: {
        approvalStatus: "CHANGES_REQUESTED",
        customerComments: note,
        status: "PREPARING",
      },
    });
    if (count === 0) throw new ApprovalNotAllowedError(app.status, app.approvalStatus);

    await tx.activityLog.create({
      data: {
        userId: actorUserId,
        actorLabel: "CUSTOMER",
        action: "APPLICATION_CHANGES_REQUESTED",
        entityType: "Application",
        entityId: applicationId,
        previousState: app.status,
        newState: "PREPARING",
        notes: note,
      },
    });

    return tx.application.findUniqueOrThrow({ where: { id: applicationId } });
  });
}
