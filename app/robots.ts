import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/checkout", "/order/", "/account", "/media/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
