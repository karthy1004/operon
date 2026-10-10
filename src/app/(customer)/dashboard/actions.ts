"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { getCustomerByUserId, getOwnedApplicationOrThrow } from "@/lib/domain/customer-queries";
import { approveApplication, requestApplicationChanges } from "@/lib/domain/application";

async function requireOwnCustomer() {
  const user = await requireCurrentUser();
  const customer = await getCustomerByUserId(user.id);
  if (!customer) throw new Error("No customer record for this user");
  return { user, customer };
}

export async function approveApplicationAction(applicationId: string) {
  const { user, customer } = await requireOwnCustomer();
  await getOwnedApplicationOrThrow(applicationId, customer.id);
  await approveApplication(applicationId, user.id);
  revalidatePath("/dashboard");
}

export async function requestChangesAction(applicationId: string, comment: string) {
  const { user, customer } = await requireOwnCustomer();
  await getOwnedApplicationOrThrow(applicationId, customer.id);
  await requestApplicationChanges(applicationId, user.id, comment);
  revalidatePath("/dashboard");
}
