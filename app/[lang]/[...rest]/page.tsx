import { notFound } from "next/navigation";

// Unknown paths inside a language (/menu/x/y, /ru/nope…) render the localized 404
// from app/[lang]/not-found.tsx, inside the site layout.
export default function CatchAll() {
  notFound();
}
