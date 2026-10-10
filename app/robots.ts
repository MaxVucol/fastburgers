import type { MetadataRoute } from "next";
import { locales, localizePath } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/site";

const PRIVATE_PATHS = ["/checkout", "/order/", "/account"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/media/", ...locales.flatMap((l) => PRIVATE_PATHS.map((p) => localizePath(l, p)))],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
