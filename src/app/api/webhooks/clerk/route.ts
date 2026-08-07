import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Keeps our User table in sync with Clerk as the source of truth for
// identity. This is the primary sync path once a webhook endpoint is
// registered in the Clerk dashboard (production/deployed only — Clerk
// can't reach localhost). Until then, src/lib/auth.ts's getCurrentUser()
// lazily creates the row on first authenticated request, so local dev
// works without a public webhook URL.
export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: WebhookEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } =
      event.data;
    const email = email_addresses[0]?.email_address;
    if (!email) return new Response("No email on Clerk user", { status: 400 });

    await prisma.user.upsert({
      where: { clerkId: id },
      create: {
        clerkId: id,
        email,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        profilePhoto: image_url ?? null,
        role: "CUSTOMER",
      },
      update: {
        email,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        profilePhoto: image_url ?? null,
      },
    });
  }

  if (event.type === "user.deleted" && event.data.id) {
    await prisma.user
      .update({
        where: { clerkId: event.data.id },
        data: { status: "DISABLED" },
      })
      .catch(() => {
        // user was never synced locally — nothing to disable
      });
  }

  return new Response("OK", { status: 200 });
}
