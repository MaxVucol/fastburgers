"use client";

/**
 * An inline <script> that runs once, during HTML parsing (server-rendered as text/javascript).
 * On the client React would warn about rendering a script tag (it never executes there), so the
 * client renders it as inert text/plain; suppressHydrationWarning covers the type difference.
 * Pattern from the Next.js "Preventing flash before hydration" guide.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
