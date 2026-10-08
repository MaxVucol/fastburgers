import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="11" fill="var(--color-accent)" />
      {/* bun */}
      <path d="M10 18.5c0-5 4.5-8.5 10-8.5s10 3.5 10 8.5a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 10 18.5Z" fill="#fff" />
      {/* cheese + patty */}
      <rect x="9" y="21.5" width="22" height="3.2" rx="1.6" fill="var(--color-mustard)" />
      {/* bottom bun */}
      <path d="M10.5 26.5h19a1 1 0 0 1 1 1c0 1.7-1.3 3-3 3h-15c-1.7 0-3-1.3-3-3a1 1 0 0 1 1-1Z" fill="#fff" />
      <circle cx="17" cy="14.5" r="0.9" fill="var(--color-accent)" />
      <circle cx="21.5" cy="13.2" r="0.9" fill="var(--color-accent)" />
      <circle cx="24.5" cy="15.6" r="0.9" fill="var(--color-accent)" />
    </svg>
  );
}

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn("inline-flex items-center gap-2.5 rounded-xl", className)}
      aria-label="fastburgers — pagina principală"
    >
      <LogoMark />
      <span className="font-display text-[1.35rem] leading-none font-extrabold tracking-tight text-ink">
        fast<span className="text-accent">burgers</span>
      </span>
    </Link>
  );
}
