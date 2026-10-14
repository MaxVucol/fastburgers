// `npm run dev`: starts `next dev` together with the local MongoDB it needs.
// When DATABASE_URL points at this machine, the database is started first (unless something already
// listens on its port), the app starts only once the database accepts connections, and the database
// is restarted if it stops while the app is running. Remote databases (Atlas) are left alone.
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Missing file: Next reports missing variables itself.
  }
}

const root = process.cwd();
const children = new Set();
let stopping = false;

function localDatabase() {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (!["127.0.0.1", "localhost", "::1"].includes(host)) return null;
    return { host: host === "localhost" ? "127.0.0.1" : host, port: Number(url.port || 27017) };
  } catch {
    return null;
  }
}

function isListening({ host, port }) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(1000);
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("timeout", () => (socket.destroy(), resolve(false)));
    socket.once("error", () => resolve(false));
  });
}

async function waitFor(db, ms) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (await isListening(db)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function run(args, name) {
  const child = spawn(process.execPath, args, { cwd: root, stdio: "inherit" });
  children.add(child);
  child.once("exit", () => children.delete(child));
  child.name = name;
  return child;
}

let restarts = 0;
async function startDatabase(db) {
  const child = run([path.join("scripts", "dev-db.mjs")], "db");
  child.once("exit", async (code) => {
    if (stopping) return;
    // Another process may have taken the port meanwhile; then there is nothing to restart.
    if (await isListening(db)) return;
    if (++restarts > 5) {
      console.error(`[dev] MongoDB stopped (code ${code}) and could not be restarted. Run "npm run db" to see why.`);
      return;
    }
    console.warn(`[dev] MongoDB stopped (code ${code}), restarting…`);
    setTimeout(() => startDatabase(db), 1000 * restarts);
  });
  if (await waitFor(db, 60_000)) restarts = 0;
  else console.error("[dev] MongoDB did not start within 60 s; pages that read the database will fail.");
}

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGINT");
  setTimeout(() => process.exit(code), 5000).unref();
  const done = () => children.size === 0 && process.exit(code);
  for (const child of children) child.once("exit", done);
  done();
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const db = localDatabase();
if (db) {
  if (await isListening(db)) console.log(`[dev] MongoDB already running on ${db.host}:${db.port}.`);
  else {
    console.log(`[dev] Starting local MongoDB on ${db.host}:${db.port}…`);
    await startDatabase(db);
  }
}

const next = run([path.join("node_modules", "next", "dist", "bin", "next"), "dev", ...process.argv.slice(2)], "next");
next.once("exit", (code) => shutdown(code ?? 0));
