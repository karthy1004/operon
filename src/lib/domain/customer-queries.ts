import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Every query here is scoped to a single customerId derived from the
 * authenticated session (see src/lib/auth.ts) — never accepts a
 * caller-supplied customer/application id without checking it belongs to
 * that customer first. This is the enforcement point for "Customer A can
 * never see Customer B's data" (08-security-compliance-and-trust.md).
 */

export async function getCustomerByUserId(userId: string) {
  return prisma.customer.findUnique({
    where: { userId },
    include: { profile: true },
  });
}

export async function getCustomerDashboardData(customerId: string) {
  const [applications, documents, activity] = await Promise.all([
    prisma.application.findMany({
      where: { customerId },
      include: { job: { include: { company: true } }, resumeVersion: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.document.findMany({
      where: { customerId, type: "RESUME" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activityLog.findMany({
      where: { entityType: "Customer", entityId: customerId },
      orderBy: { timestamp: "desc" },
      take: 10,
    }),
  ]);

  return { applications, documents, activity };
}

/** Throws if the application doesn't belong to this customer — the RBAC gate. */
export async function getOwnedApplicationOrThrow(applicationId: string, customerId: string) {
  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
  });
  if (app.customerId !== customerId) {
    throw new Error("Not authorized to access this application");
  }
  return app;
}
