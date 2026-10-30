/**
 * Single flight: while a job for a key is running, everyone who asks for the same key gets the same promise
 * instead of starting another job. One hundred visitors opening the menu together make one picture, not a hundred.
 */
export class SingleFlight<T> {
  private readonly running = new Map<string, Promise<T>>();

  /** Number of distinct jobs in the air (for tests and diagnostics). */
  get size(): number {
    return this.running.size;
  }

  run(key: string, job: () => Promise<T>): Promise<T> {
    const existing = this.running.get(key);
    if (existing) return existing;
    const promise = (async () => job())().finally(() => this.running.delete(key));
    this.running.set(key, promise);
    return promise;
  }
}

/** At most `limit` jobs at a time; the rest wait their turn. Keeps the image encoder from eating all the memory. */
export class Limiter {
  private active = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  async run<T>(job: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>((resolve) => this.waiting.push(resolve));
    this.active++;
    try {
      return await job();
    } finally {
      this.active--;
      this.waiting.shift()?.();
    }
  }
}
