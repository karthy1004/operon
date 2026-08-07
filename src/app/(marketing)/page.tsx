import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingHome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-4xl text-pine-deep">Operon</p>
      <p className="max-w-md text-ink-soft">
        You own your career. We own the execution.
      </p>
      <Button className="font-sans" asChild>
        <Link href="/sign-up">Get started</Link>
      </Button>
    </main>
  );
}
