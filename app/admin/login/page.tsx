import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { LogoMark } from "@/components/layout/logo";

export const metadata: Metadata = { title: "Autentificare" };

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="size-12" />
          <h1 className="mt-4 text-2xl font-extrabold">Panou de administrare</h1>
          <p className="mt-1 text-sm text-muted">Autentifică-te pentru a gestiona meniul și comenzile.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-soft)] ring-1 ring-line">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-muted hover:text-ink">
            ← Înapoi la site
          </Link>
        </p>
      </div>
    </main>
  );
}
