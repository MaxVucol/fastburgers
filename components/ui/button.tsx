import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "dark" | "outline" | "outline-light" | "light" | "ghost" | "soft";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none " +
  "transition-[background-color,color,border-color,transform] duration-[var(--duration-base)] ease-[var(--ease-out-brand)] " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  // Orange with dark text (on-accent): 5.1:1 contrast (white on this orange would fail AA).
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  // Inverted fill: graphite in the light theme, near-white in the dark one.
  dark: "bg-ink text-on-ink hover:bg-ink-soft",
  outline: "border-[1.5px] border-ink/85 text-ink hover:bg-ink hover:text-on-ink",
  // For dark sections.
  "outline-light": "border-[1.5px] border-on-dark/35 text-on-dark hover:border-on-dark hover:bg-on-dark/5",
  // Light pill on the always-dark blocks (both themes).
  light: "bg-on-dark text-graphite hover:bg-on-dark/85",
  ghost: "text-ink hover:bg-sand",
  soft: "bg-sand text-ink hover:bg-oat",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
  icon: "size-11",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
