import type { Locale } from "@/lib/i18n/config";

/** Small flags for the language items of the header's category row (3:2, drawn inline). */
export function LocaleFlag({ locale }: { locale: Locale }) {
  const common = { viewBox: "0 0 60 40", "aria-hidden": true, className: "h-8 w-12 rounded-[0.3rem] ring-1 ring-white/15 sm:h-9 sm:w-14" } as const;
  if (locale === "ro") {
    return (
      <svg {...common}>
        <rect width="20" height="40" fill="#002B7F" />
        <rect x="20" width="20" height="40" fill="#FCD116" />
        <rect x="40" width="20" height="40" fill="#CE1126" />
      </svg>
    );
  }
  if (locale === "ru") {
    return (
      <svg {...common}>
        <rect width="60" height="14" fill="#FFFFFF" />
        <rect y="13.4" width="60" height="13.4" fill="#0039A6" />
        <rect y="26.7" width="60" height="13.3" fill="#D52B1E" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#C8102E" strokeWidth="3" />
      <path d="M30 0v40M0 20h60" stroke="#FFFFFF" strokeWidth="13" />
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="8" />
    </svg>
  );
}
