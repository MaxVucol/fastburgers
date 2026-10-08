"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonStyles } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-3xl font-extrabold">Ceva n-a mers cum trebuia.</h1>
      <p className="mt-3 max-w-md text-muted">
        Am întâmpinat o eroare neașteptată. Încearcă din nou — dacă problema persistă, sună-ne și preluăm comanda telefonic.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Încearcă din nou</Button>
        <Link href="/" className={buttonStyles({ variant: "outline" })}>
          Acasă
        </Link>
      </div>
    </main>
  );
}
