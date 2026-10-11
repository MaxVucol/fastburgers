// Lets `node --test` run the app's TypeScript modules without extra tooling:
// resolves the "@/…" path alias (and extensionless relative imports) to .ts files,
// and replaces "server-only" (which throws outside React Server Components) with an empty module.
import { register } from "node:module";

register("./hooks.mjs", import.meta.url);
