import Link from "next/link";
import { LogoMark } from "@/components/layout/logo";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <LogoMark className="size-14" />
      <p className="mt-6 font-display text-7xl font-extrabold text-accent">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">Pagina asta s-a mâncat.</h1>
      <p className="mt-3 max-w-md text-muted">
        Produsul sau pagina căutată nu mai există. Dar meniul e plin de alte lucruri bune.
      </p>
      <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row">
        <Link href="/menu" className={buttonStyles({ size: "lg" })}>
          Vezi meniul
        </Link>
        <Link href="/" className={buttonStyles({ size: "lg", variant: "outline" })}>
          Pagina principală
        </Link>
      </div>
    </main>
  );
}
