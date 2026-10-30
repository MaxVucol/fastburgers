// L2: the server's own memory. The fastest layer a request can hit, shared by every request that
// one function instance serves, gone when the instance is recycled (the database layer below it survives).

export type CachedImage = { body: Buffer; contentType: string };

/** A least-recently-used cache bounded by the bytes it holds, not by the number of entries. */
export class MemoryImageCache {
  private readonly entries = new Map<string, CachedImage>();
  private bytes = 0;

  constructor(private readonly maxBytes: number) {}

  get(key: string): CachedImage | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    // Re-insert: a Map iterates in insertion order, so the oldest-used entry is always first.
    this.entries.delete(key);
    this.entries.set(key, hit);
    return hit;
  }

  set(key: string, image: CachedImage): void {
    // One picture bigger than a quarter of the budget would push everything else out.
    if (image.body.byteLength > this.maxBytes / 4) return;
    const old = this.entries.get(key);
    if (old) {
      this.bytes -= old.body.byteLength;
      this.entries.delete(key);
    }
    this.entries.set(key, image);
    this.bytes += image.body.byteLength;
    for (const [oldestKey, oldest] of this.entries) {
      if (this.bytes <= this.maxBytes) break;
      this.entries.delete(oldestKey);
      this.bytes -= oldest.body.byteLength;
    }
  }

  get size(): number {
    return this.entries.size;
  }

  get byteSize(): number {
    return this.bytes;
  }
}
