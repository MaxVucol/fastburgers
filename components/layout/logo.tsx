import Link from "next/link";
import { Spark } from "@/components/ui/brand";
import { cn } from "@/lib/utils";

/** The spark on its own — favicon-sized brand mark. */
export function LogoMark({ className }: { className?: string }) {
  return <Spark className={cn("size-9 text-accent", className)} />;
}

export function Wordmark({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Spark className="size-[0.82em] shrink-0 text-accent" />
      <span
        className={cn(
          "font-sans leading-none font-extrabold tracking-[-0.045em]",
          tone === "dark" ? "text-on-dark" : "text-ink",
        )}
      >
        fastburgers
      </span>
    </span>
  );
}

export function Logo({
  href = "/",
  label = "fastburgers",
  tone = "light",
  className,
  onClick,
}: {
  href?: string;
  label?: string;
  tone?: "light" | "dark";
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={cn("inline-flex rounded-[var(--radius-xs)]", className)} aria-label={label}>
      <Wordmark tone={tone} className="text-[1.6rem] lg:text-[1.75rem]" />
    </Link>
  );
}
