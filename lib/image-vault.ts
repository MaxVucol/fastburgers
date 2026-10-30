// The browser's own copy of the pictures it has seen: IndexedDB, keyed by the /img URL.
//
// The HTTP cache already keeps them, but browsers drop it freely (Safari after a week without a visit, any
// browser when the disk is tight), and then the whole menu is fetched again. IndexedDB is kept longer and
// is ours to size: up to ~60 MB, oldest pictures leave first. Every URL names its picture, width and quality,
// and a copy is trusted for 30 days (the same lifetime the server gives it), so no revalidation is needed.
//
// Everything here fails quietly: private windows, blocked storage or a full disk simply mean "not in the vault".

const DB_NAME = "fastburgers-images";
const STORE = "pictures";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_BYTES = 60 * 1024 * 1024;
const PRUNE_EVERY = 25;

type Entry = { url: string; blob: Blob; savedAt: number; size: number };

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const open = indexedDB.open(DB_NAME, 1);
      open.onupgradeneeded = () => {
        const store = open.result.createObjectStore(STORE, { keyPath: "url" });
        store.createIndex("savedAt", "savedAt");
      };
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => resolve(null);
      open.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

// Looking pictures up one transaction each would be hundreds of transactions on a long menu: requests made in the
// same tick share one.
let pending: { url: string; resolve: (blob: Blob | null) => void }[] = [];

export function vaultGet(url: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    pending.push({ url, resolve });
    if (pending.length === 1) queueMicrotask(flush);
  });
}

async function flush() {
  const batch = pending;
  pending = [];
  const db = await openDb();
  if (!db) return batch.forEach((item) => item.resolve(null));
  try {
    const transaction = db.transaction(STORE, "readonly");
    const store = transaction.objectStore(STORE);
    const now = Date.now();
    for (const item of batch) {
      const request = store.get(item.url);
      request.onsuccess = () => {
        const entry = request.result as Entry | undefined;
        item.resolve(entry && now - entry.savedAt < MAX_AGE_MS ? entry.blob : null);
      };
      request.onerror = () => item.resolve(null);
    }
    transaction.onerror = transaction.onabort = () => batch.forEach((item) => item.resolve(null));
  } catch {
    batch.forEach((item) => item.resolve(null));
  }
}

let stored = 0;

export async function vaultPut(url: string, blob: Blob): Promise<void> {
  const db = await openDb();
  if (!db || blob.size === 0 || blob.size > MAX_BYTES / 8) return;
  try {
    const entry: Entry = { url, blob, savedAt: Date.now(), size: blob.size };
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(entry);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => resolve();
    });
    if (++stored % PRUNE_EVERY === 0) await prune(db);
  } catch {
    // Full disk or blocked storage: the picture is simply not kept.
  }
}

/** Walks from the oldest picture: drops the expired ones, then the oldest until the vault fits its budget. */
async function prune(db: IDBDatabase): Promise<void> {
  await new Promise<void>((resolve) => {
    try {
      const transaction = db.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      const total = { bytes: 0 };
      const sizes: { url: string; savedAt: number; size: number }[] = [];
      const cursor = store.index("savedAt").openCursor();
      cursor.onsuccess = () => {
        const current = cursor.result;
        if (current) {
          const { url, savedAt, size } = current.value as Entry;
          sizes.push({ url, savedAt, size });
          total.bytes += size;
          current.continue();
          return;
        }
        const cutoff = Date.now() - MAX_AGE_MS;
        for (const item of sizes) {
          if (item.savedAt < cutoff || total.bytes > MAX_BYTES) {
            store.delete(item.url);
            total.bytes -= item.size;
          } else break;
        }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}
