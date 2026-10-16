type Env = Record<string, string | undefined>;

export const PREVIEW_DATABASE_NAME: "fastburgers_preview";
export function isPreviewDeployment(env?: Env): boolean;
export function databaseNameOf(url: unknown): string | null;
export function checkPreviewDatabase(env?: Env): { ok: true } | { ok: false; reason: string };
export function previewDatabaseBlocked(env?: Env): boolean;
export function outboundChannelsClosed(env?: Env): boolean;
export function ordersAreDemo(env?: Env): boolean;
