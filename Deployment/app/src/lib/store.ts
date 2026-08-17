import * as fs from "fs";
import * as path from "path";
import { googleFetch, isGoogleConfigured } from "./google-auth";
import {
  SHEET_SCHEMA,
  coerce,
  getPath,
  setPath,
  toCell,
  type TabSpec,
} from "./sheet-schema";
import { getSheetId } from "./google-config";

/**
 * Document store for everything the admin panel edits.
 *
 * Documents keep exactly the JSON shapes the route handlers already used, so
 * no API contract and no client component changed in the migration. How those
 * shapes map onto spreadsheet tabs, headers, and typed columns lives in
 * ./sheet-schema.
 *
 * Two backends:
 *   - "fs"     — the original `.env.<key>.json` files. Still the default, so
 *                `npm run dev` works with no Google setup at all.
 *   - "sheets" — Google Sheets, selected automatically once the Google env
 *                vars are present.
 *
 * The fs backend is not merely a fallback for local convenience: Render's
 * filesystem is ephemeral and wipes on every deploy, which is the whole reason
 * this layer exists. Deploys must run on "sheets".
 */

export type DocKey =
  | "home-text"
  | "cards"
  | "projects"
  | "about-content"
  | "smtp"
  | "social-config"
  | "social-post-log"
  | "visitor-count"
  | "admin-auth"
  | "google-oauth";

export const DOC_KEYS: DocKey[] = [
  "google-oauth",
  "home-text",
  "cards",
  "projects",
  "about-content",
  "smtp",
  "social-config",
  "social-post-log",
  "visitor-count",
  "admin-auth",
];

export function activeBackend(): "fs" | "sheets" {
  return isGoogleConfigured() ? "sheets" : "fs";
}

/* ------------------------------------------------------------------ cache */

// Sheets allows roughly 60 reads/minute per user, and the public landing page
// fans out to four config GETs on every visit — home-text, cards, projects,
// about-content. Without a cache a couple of simultaneous visitors would trip
// the quota and the site would start serving defaults. Writes invalidate their
// own key immediately, so an admin save is live on the very next request
// rather than up to a TTL later.
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  value: unknown;
  expires: number;
}

const cache = new Map<DocKey, CacheEntry>();

export function invalidate(key?: DocKey): void {
  if (key) cache.delete(key);
  else cache.clear();
}

/* --------------------------------------------------------------- fs impl */

function filePath(key: DocKey): string {
  return path.join(process.cwd(), `.env.${key}.json`);
}

function fsRead<T>(key: DocKey): T | null {
  const p = filePath(key);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

function fsWrite<T>(key: DocKey, value: T): void {
  fs.writeFileSync(filePath(key), JSON.stringify(value, null, 2), "utf-8");
}

/* -------------------------------------------------------------- mirror */

/**
 * Durable last-known-good local copy of every document.
 *
 * Sheets is the source of truth, but a read can fail transiently — most
 * often a 429, since Sheets allows only ~60 reads/minute/user and each page
 * load fans out to several config GETs. Before this mirror existed, a failed
 * read with no live cache entry threw, the API route answered 500, and the
 * public page fell back to its hardcoded placeholders — so a visitor saw
 * "Placeholder content" where real saved cards belonged, which is
 * indistinguishable from the admin's content having been deleted.
 *
 * Every successful read and every write refreshes this mirror, so a failed
 * read can always answer with real content. It deliberately reuses the
 * fs-backend filenames: the mirror *is* a local copy of the document, so if
 * Google is ever unconfigured the fs backend picks these up rather than
 * resetting the site to defaults.
 */
function mirrorWrite<T>(key: DocKey, value: T): void {
  try {
    fsWrite(key, value);
  } catch (error) {
    // A read-only or full filesystem must never break serving content.
    console.error(`[store] mirror write failed for "${key}":`, error);
  }
}

/** Reads the mirror. Returns null when nothing has been mirrored yet. */
function mirrorRead<T>(key: DocKey): T | null {
  return fsRead<T>(key);
}

/* ----------------------------------------------------------- sheets impl */

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

function sheetId(): string {
  const id = getSheetId();
  if (!id) throw new Error("No Google Spreadsheet configured");
  return id;
}

async function listTabs(): Promise<Set<string>> {
  const res = await googleFetch(`${SHEETS_API}/${sheetId()}?fields=sheets.properties.title`);
  const data = (await res.json()) as { sheets?: { properties?: { title?: string } }[] };
  return new Set((data.sheets ?? []).map((s) => s.properties?.title ?? ""));
}

/** Creates any of the given tabs that don't exist yet, in one batch call. */
async function ensureTabs(tabs: string[]): Promise<void> {
  const existing = await listTabs();
  const missing = tabs.filter((t) => !existing.has(t));
  if (missing.length === 0) return;

  await googleFetch(`${SHEETS_API}/${sheetId()}:batchUpdate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    }),
  });
}

/** Reads a whole tab as a grid. Returns null when the tab does not exist. */
async function readGrid(tab: string): Promise<string[][] | null> {
  try {
    const res = await googleFetch(
      `${SHEETS_API}/${sheetId()}/values/${encodeURIComponent(tab)}`
    );
    const data = (await res.json()) as { values?: string[][] };
    return data.values ?? [];
  } catch (error) {
    // A tab that has never been written is the normal state before the first
    // save, not a failure — Sheets reports it as a 400.
    if (error instanceof Error && /\b400\b/.test(error.message)) return null;
    throw error;
  }
}

function rowsForTab(spec: TabSpec, doc: unknown): (string | number | boolean)[][] {
  if (spec.kind === "kv") {
    return [
      ["Setting", "Value"],
      ...spec.fields.map((field) => [field.header, toCell(getPath(doc, field.path))]),
    ];
  }

  const list = getPath(doc, spec.path);
  const items = Array.isArray(list) ? list : [];

  if (spec.scalar) {
    return [[spec.scalar.header], ...items.map((item) => [toCell(item)])];
  }

  const columns = spec.columns ?? [];
  return [
    columns.map((c) => c.header),
    ...items.map((item) => columns.map((c) => toCell((item as Record<string, unknown>)[c.key]))),
  ];
}

function parseTab(spec: TabSpec, grid: string[][], into: Record<string, unknown>): void {
  // Row 1 is always headers; data starts at row 2. Headers are for humans —
  // the schema's declared order is authoritative, so renaming a header in the
  // spreadsheet is cosmetic and cannot silently remap a column.
  const body = grid.slice(1);

  if (spec.kind === "kv") {
    spec.fields.forEach((field, i) => {
      const raw = body[i]?.[1];
      if (raw === undefined) return;
      setPath(into, field.path, coerce(raw, field.type));
    });
    return;
  }

  if (spec.scalar) {
    const values = body.map((row) => row[0]).filter((v) => v !== undefined && v !== "");
    setPath(into, spec.path, values);
    return;
  }

  const columns = spec.columns ?? [];
  const items = body
    // Skip fully blank rows so a stray newline in the sheet doesn't become an
    // empty card on the live site.
    .filter((row) => row.some((cell) => cell !== undefined && String(cell).trim() !== ""))
    .map((row) => {
      const item: Record<string, unknown> = {};
      columns.forEach((c, i) => {
        item[c.key] = coerce(row[i], c.type);
      });
      return item;
    });

  if (spec.path) setPath(into, spec.path, items);
  else Object.assign(into, { __rootArray: items });
}

async function sheetsRead<T>(key: DocKey): Promise<T | null> {
  const specs = SHEET_SCHEMA[key];
  const grids = await Promise.all(specs.map((spec) => readGrid(spec.tab)));

  // Nothing saved yet for this document — let the caller fall back to defaults
  // rather than handing back a hollowed-out object.
  if (grids.every((g) => g === null || g.length <= 1)) return null;

  const assembled: Record<string, unknown> = {};
  specs.forEach((spec, i) => {
    const grid = grids[i];
    if (grid) parseTab(spec, grid, assembled);
  });

  // The post log is a bare array at the document root rather than an object.
  if ("__rootArray" in assembled) return assembled.__rootArray as T;
  return assembled as T;
}

async function sheetsWrite<T>(key: DocKey, value: T): Promise<void> {
  const specs = SHEET_SCHEMA[key];
  await ensureTabs(specs.map((s) => s.tab));

  for (const spec of specs) {
    const rows = rowsForTab(spec, value);

    // Clear before writing: an update alone only overwrites the cells it
    // covers, so shrinking a list (7 projects down to 3) would leave the old
    // trailing rows behind and they would read back as real items.
    await googleFetch(
      `${SHEETS_API}/${sheetId()}/values/${encodeURIComponent(spec.tab)}:clear`,
      { method: "POST" }
    );

    await googleFetch(
      `${SHEETS_API}/${sheetId()}/values/${encodeURIComponent(
        `${spec.tab}!A1`
      )}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // RAW rather than USER_ENTERED so a value beginning with "=" is stored
        // as text instead of being evaluated as a formula.
        body: JSON.stringify({ values: rows }),
      }
    );
  }
}

/* -------------------------------------------------------------- capping */

const SEEN_IDS_CAP = 5_000;

/**
 * Trims unbounded collections. Only visitor-count needs this: `seenIds` grows
 * by one uuid per unique visitor forever, and every save rewrites the whole
 * tab, so an uncapped list would make each page view progressively more
 * expensive. Dropping the oldest ids means a visitor who has not returned in
 * 5,000 unique-visitor-cycles gets counted twice — a much better failure than
 * a write that keeps getting slower.
 */
function capForStorage<T>(key: DocKey, value: T): T {
  if (key !== "visitor-count") return value;
  const store = value as unknown as { count?: number; seenIds?: string[] };
  if (!Array.isArray(store?.seenIds) || store.seenIds.length <= SEEN_IDS_CAP) return value;
  return { ...store, seenIds: store.seenIds.slice(-SEEN_IDS_CAP) } as unknown as T;
}

/* ----------------------------------------------------------------- API */

export async function readDoc<T>(key: DocKey, fallback: T): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  if (activeBackend() === "sheets") {
    let value: T | null = null;
    try {
      value = await sheetsRead<T>(key);
    } catch (error) {
      console.error(`[store] sheets read failed for "${key}":`, error);
      // Real content always beats placeholders. Fall back in decreasing
      // freshness: an expired cache entry, then the on-disk mirror. Only a
      // document that has genuinely never been saved anywhere can fail here.
      const stale = (hit?.value as T | undefined) ?? mirrorRead<T>(key);
      if (stale !== null && stale !== undefined) return stale;
      throw error;
    }

    if (value !== null) {
      // Real saved content: cache it and refresh the durable mirror.
      cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
      mirrorWrite(key, value);
      return value;
    }

    // Sheets answered, but this document has never been written to it. Serve
    // the mirror if we have one, else the built-in defaults — and do NOT
    // cache defaults: pinning a placeholder for the whole TTL is what made a
    // single bad moment look like the admin's content had been wiped.
    return mirrorRead<T>(key) ?? fallback;
  }

  const local = fsRead<T>(key);
  if (local !== null) {
    cache.set(key, { value: local, expires: Date.now() + CACHE_TTL_MS });
    return local;
  }
  return fallback;
}

export async function writeDoc<T>(key: DocKey, value: T): Promise<void> {
  const capped = capForStorage(key, value);
  if (activeBackend() === "sheets") {
    // Sheets first: if it rejects, the save genuinely failed, so neither the
    // mirror nor the cache should claim otherwise — the route returns 500 and
    // the admin sees the error instead of a false success.
    await sheetsWrite(key, capped);
    mirrorWrite(key, capped);
  } else {
    fsWrite(key, capped);
  }
  // Cache the value we just wrote rather than merely evicting, so the next
  // read does not pay a round-trip for something we already know.
  cache.set(key, { value: capped, expires: Date.now() + CACHE_TTL_MS });
}

/** Returns true if the document exists in the active backend. */
export async function docExists(key: DocKey): Promise<boolean> {
  if (activeBackend() === "sheets") {
    return (await sheetsRead<unknown>(key)) !== null;
  }
  return fs.existsSync(filePath(key));
}
