import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutCanceledPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-2xl">Checkout canceled</p>
      <p className="max-w-md text-ink-soft">
        No charge was made. You can pick a plan again whenever you&apos;re ready.
      </p>
      <Button asChild>
        <Link href="/pricing">Back to pricing</Link>
      </Button>
    </main>
  );
}
