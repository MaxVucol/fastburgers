import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = new URL("../../", import.meta.url);

function withExtension(url) {
  const path = fileURLToPath(url);
  for (const candidate of [path, `${path}.ts`, `${path}.tsx`, `${path}/index.ts`]) {
    if (existsSync(candidate) && !candidate.endsWith("/") && /\.(ts|tsx|mjs|js)$/.test(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
  if (specifier.startsWith("@/")) {
    const url = withExtension(new URL(specifier.slice(2), root));
    if (url) return { url, shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const url = withExtension(new URL(specifier, context.parentURL));
    if (url) return { url, shortCircuit: true };
  }
  // Next's own entry points ("next/headers", "next/server") are CommonJS files that need the extension in ESM.
  if (/^next\/[a-z-]+$/.test(specifier)) return next(`${specifier}.js`, context);
  return next(specifier, context);
}
