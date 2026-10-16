import { siteConfig } from "@/lib/site";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.125rem]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.125rem]" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
    </svg>
  );
}
function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.125rem]" fill="currentColor" aria-hidden>
      <path d="M16.6 3c.4 2.1 1.7 3.4 3.9 3.6v3a7 7 0 0 1-3.9-1.2v6.3A5.7 5.7 0 1 1 10.9 9v3.1a2.6 2.6 0 1 0 2.6 2.6V3h3.1Z" />
    </svg>
  );
}

/** Only profiles that are actually configured get an icon (see siteConfig.social). */
export function configuredSocials() {
  return [
    { href: siteConfig.social.instagram, label: "Instagram", icon: <InstagramIcon /> },
    { href: siteConfig.social.facebook, label: "Facebook", icon: <FacebookIcon /> },
    { href: siteConfig.social.tiktok, label: "TikTok", icon: <TiktokIcon /> },
  ].filter((s) => s.href !== "");
}
