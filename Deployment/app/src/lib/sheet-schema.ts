import type { DocKey } from "./store";

/**
 * How each stored document is laid out across spreadsheet tabs.
 *
 * The obvious implementation would be to dump each document's JSON into a
 * single cell. That round-trips perfectly and needs no schema — but it makes
 * the spreadsheet unreadable and unusable as a spreadsheet, which defeats the
 * point of choosing Sheets as the datastore. So every document is decomposed
 * into a real header row and typed columns.
 *
 * Two tab shapes cover everything:
 *
 *   table — an array of records becomes a header row plus one row per item
 *           (cards, projects, sentences, flashcards, the post log). A
 *           `scalar` table is an array of plain strings in one column.
 *   kv    — a bag of scalar settings becomes two columns, Setting | Value,
 *           one row per field. Dotted paths express nesting.
 *
 * Documents that are part list and part settings (home-text, about-content,
 * visitor-count) simply declare one of each, on separate tabs.
 *
 * Sheets returns every cell as a string, so each field carries a type used to
 * coerce values back on read. Without that, `fontSize` would come back as
 * "42" and arithmetic on it would silently produce string concatenation.
 */

export type FieldType = "string" | "number" | "boolean" | "nullableString";

export interface Column {
  /** Key on the record. */
  key: string;
  /** Human-facing header text written into row 1. */
  header: string;
  type: FieldType;
}

export interface TableSpec {
  kind: "table";
  tab: string;
  /**
   * Property on the document holding the array, or "" when the document *is*
   * the array (the social post log).
   */
  path: string;
  columns?: Column[];
  /** Set for arrays of plain strings; `columns` is then a single header. */
  scalar?: { header: string };
}

export interface KeyValueSpec {
  kind: "kv";
  tab: string;
  fields: { path: string; header: string; type: FieldType }[];
}

export type TabSpec = TableSpec | KeyValueSpec;

const col = (key: string, header: string, type: FieldType = "string"): Column => ({
  key,
  header,
  type,
});

const f = (path: string, header: string, type: FieldType = "string") => ({ path, header, type });

export const SHEET_SCHEMA: Record<DocKey, TabSpec[]> = {
  "home-text": [
    {
      kind: "kv",
      tab: "Home Text Settings",
      fields: [
        f("fontFamily", "Font Family"),
        f("fontSize", "Font Size (px)", "number"),
        f("textColor", "Text Colour"),
        f("letterSpacing", "Letter Spacing (px)", "number"),
      ],
    },
    {
      kind: "table",
      tab: "Home Text Sentences",
      path: "sentences",
      columns: [col("id", "ID"), col("text", "Sentence")],
    },
  ],

  cards: [
    {
      kind: "table",
      tab: "Cards",
      path: "cards",
      columns: [
        col("id", "ID"),
        col("title", "Title"),
        col("description", "Description"),
        col("imageUrl", "Image URL", "nullableString"),
      ],
    },
  ],

  projects: [
    {
      kind: "table",
      tab: "Projects",
      path: "projects",
      columns: [
        col("id", "ID"),
        col("title", "Title"),
        col("briefInfo", "Brief Info"),
        col("approxPrice", "Approx Price"),
        col("imageUrl", "Image URL", "nullableString"),
        col("order", "Order", "number"),
      ],
    },
  ],

  "about-content": [
    {
      kind: "kv",
      tab: "About Content",
      fields: [
        f("headline", "Headline"),
        f("headlineFontFamily", "Headline Font"),
        f("headlineFontSize", "Headline Size (px)", "number"),
        f("headlineColor", "Headline Colour"),
        f("body", "Body Text"),
        f("bodyFontFamily", "Body Font"),
        f("bodyFontSize", "Body Size (px)", "number"),
        f("bodyColor", "Body Colour"),
      ],
    },
    {
      kind: "table",
      tab: "About Flashcards",
      path: "flashcards",
      columns: [
        col("id", "ID"),
        col("title", "Title"),
        col("text", "Text"),
        col("imageUrl", "Image URL", "nullableString"),
      ],
    },
  ],

  smtp: [
    {
      kind: "kv",
      tab: "SMTP",
      fields: [
        f("host", "Host"),
        f("port", "Port", "number"),
        f("secure", "Use TLS", "boolean"),
        f("user", "Username"),
        f("password", "Password"),
        f("fromEmail", "From Address"),
      ],
    },
  ],

  "social-config": [
    {
      kind: "kv",
      tab: "Social Config",
      fields: [
        f("instagram.connected", "Instagram Connected", "boolean"),
        f("instagram.accountId", "Instagram Account ID"),
        f("instagram.accessToken", "Instagram Access Token"),
        f("facebook.connected", "Facebook Connected", "boolean"),
        f("facebook.pageId", "Facebook Page ID"),
        f("facebook.accessToken", "Facebook Access Token"),
      ],
    },
  ],

  "social-post-log": [
    {
      kind: "table",
      tab: "Social Post Log",
      path: "",
      columns: [
        col("postedAt", "Posted At"),
        col("platform", "Platform"),
        col("success", "Success", "boolean"),
        col("simulated", "Simulated", "boolean"),
        col("text", "Text"),
        col("imageUrl", "Image URL", "nullableString"),
        col("videoUrl", "Video URL", "nullableString"),
      ],
    },
  ],

  "visitor-count": [
    {
      kind: "kv",
      tab: "Visitor Count",
      fields: [f("count", "Total Visitors", "number")],
    },
    {
      kind: "table",
      tab: "Visitor IDs",
      path: "seenIds",
      scalar: { header: "Visitor ID" },
    },
  ],

  "admin-auth": [
    {
      kind: "kv",
      tab: "Admin Credentials",
      fields: [
        f("username", "Username"),
        f("passwordHash", "Password Hash (scrypt salt:hash)"),
        f("codeHash", "Login Code Hash (scrypt salt:hash)"),
      ],
    },
  ],

  // The refresh token behind "Connect Google Drive". Service accounts have no
  // storage quota on a personal (non-Workspace) Drive — uploads must run as
  // the real account owner instead, via a one-time OAuth consent that this
  // token lets the server renew indefinitely without asking again.
  "google-oauth": [
    {
      kind: "kv",
      tab: "Google Drive Connection",
      fields: [
        f("connectedEmail", "Connected Account"),
        f("refreshToken", "Refresh Token"),
      ],
    },
  ],
};

/* ------------------------------------------------------------ conversion */

export function coerce(raw: unknown, type: FieldType): unknown {
  const s = raw === undefined || raw === null ? "" : String(raw);

  switch (type) {
    case "number": {
      const n = Number(s);
      return s === "" || Number.isNaN(n) ? 0 : n;
    }
    case "boolean":
      return s.toUpperCase() === "TRUE";
    case "nullableString":
      return s === "" ? null : s;
    default:
      return s;
  }
}

/** Serialises a value for a cell. Sheets has no null, so it becomes blank. */
export function toCell(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return value;
  return String(value);
}

export function getPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path
    .split(".")
    .reduce<unknown>(
      (acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined),
      obj
    );
}

export function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let cursor = obj;
  for (const part of parts.slice(0, -1)) {
    if (typeof cursor[part] !== "object" || cursor[part] === null) cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

/** Every tab this schema will create, in the order they should appear. */
export function allTabs(): string[] {
  return Object.values(SHEET_SCHEMA).flatMap((specs) => specs.map((s) => s.tab));
}
