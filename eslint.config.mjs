import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Every picture goes through components/ui/smart-image.tsx (the site's optimizer and the browser-side cache).
  {
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "next/image", message: 'Use SmartImage from "@/components/ui/smart-image": it carries the image cache layers.' }] },
      ],
    },
  },
  { files: ["components/ui/smart-image.tsx"], rules: { "no-restricted-imports": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
