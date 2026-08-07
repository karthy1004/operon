import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * Resolves the signed-in Clerk session to our local User row.
 *
 * Primary sync path is the Clerk webhook (src/app/api/webhooks/clerk),
 * which only reaches us once deployed. This lazily creates the row on
 * first authenticated request too, so login works in local dev without a
 * public webhook URL, and so a delayed/missed webhook never locks
 * someone out of their own account.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return prisma.user.create({
    data: {
      clerkId: userId,
      email,
      firstName: clerkUser.firstName ?? "",
      lastName: clerkUser.lastName ?? "",
      profilePhoto: clerkUser.imageUrl ?? null,
      role: "CUSTOMER",
    },
  });
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}
