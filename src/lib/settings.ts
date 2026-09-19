import { db } from "./db";

export type Settings = Record<string, string>;

// Cache settings in-memory for a short period to avoid hitting DB on every request.
// IMPORTANT: This cache is per-module-instance. In dev (Turbopack), server components
// and API routes share the same module instance, so clearSettingsCache() works.
// In production, this runs in the same server process.
let cache: Settings | null = null;
let cacheTime = 0;
const TTL = 5_000; // 5 seconds — short enough that changes appear quickly

export async function getSettings(): Promise<Settings> {
  const now = Date.now();
  if (cache && now - cacheTime < TTL) return cache;
  const rows = await db.setting.findMany();
  const map: Settings = {};
  for (const r of rows) map[r.key] = r.value;
  cache = map;
  cacheTime = now;
  return map;
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const s = await getSettings();
  return s[key] ?? fallback;
}

// Toggle tampilan publik seluruh fitur Market (halaman /financial-market,
// link nav/footer, artikel market di home/blog/search/sitemap/RSS).
// Default ON: hanya "false" eksplisit yang menyembunyikan.
export function isMarketEnabled(s: Settings): boolean {
  return s.market_section !== "false";
}

export async function setSetting(key: string, value: string, group = "GENERAL", type = "TEXT") {
  await db.setting.upsert({
    where: { key },
    create: { key, value, group, type },
    update: { value, group, type },
  });
  cache = null; // invalidate
}

export async function setSettings(items: { key: string; value: string; group?: string; type?: string }[]) {
  for (const item of items) {
    await db.setting.upsert({
      where: { key: item.key },
      create: { key: item.key, value: item.value, group: item.group ?? "GENERAL", type: item.type ?? "TEXT" },
      update: { value: item.value, group: item.group, type: item.type },
    });
  }
  cache = null;
}

export function clearSettingsCache() {
  cache = null;
  cacheTime = 0;
}
