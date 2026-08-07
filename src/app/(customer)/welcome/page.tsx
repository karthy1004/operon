import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WelcomePage() {
  const user = await requireCurrentUser();
  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-3xl text-pine-deep">
        Welcome to Operon, {user.firstName || "there"}.
      </p>
      <p className="max-w-md text-ink-soft">
        {customer
          ? "Your subscription is active. Onboarding — uploading your resume and telling us about your search — comes next."
          : "We're still confirming your subscription with Stripe. This usually takes a few seconds — refresh shortly."}
      </p>
    </main>
  );
}
