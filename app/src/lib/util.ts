import type { TextBlock } from "./db";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
export const naturalCompare = (a: string, b: string) => collator.compare(a, b);

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;
export const isImageName = (name: string) =>
  IMAGE_EXT.test(name) && !name.split("/").some((part) => part.startsWith(".") || part === "__MACOSX");
export const isArchiveName = (name: string) => /\.(cbz|zip)$/i.test(name);

export function mediaTypeFor(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    gif: "image/gif", avif: "image/avif", bmp: "image/bmp",
  };
  return map[ext] ?? "application/octet-stream";
}

// Only real file extensions: "Ch. 10.5" must keep its ".5".
export const stripExt = (name: string) => name.replace(/\.(cbz|zip|jpe?g|png|webp|gif|avif|bmp)$/i, "");

/** The last number in a chapter name, or -1 when there is none. "Vol.2 Ch. 10.5" -> 10.5 */
export function parseChapterNumber(name: string): number {
  const matches = stripExt(name).match(/\d+(?:\.\d+)?/g);
  return matches ? Number(matches[matches.length - 1]) : -1;
}

/** Guess a series title from an archive name: "My Series - c012 (2020).cbz" -> "My Series" */
export function seriesTitleFromFilename(name: string): string {
  let t = stripExt(name).replace(/[_]+/g, " ");
  t = t.replace(/[\[(][^\])]*[\])]/g, " ");
  t = t.replace(/\b(?:vol(?:ume)?|v|ch(?:apter)?|c|ep(?:isode)?|#)\.?\s*\d+(?:\.\d+)?.*$/i, "");
  t = t.replace(/[\s\-–—:,.]+\d+(?:\.\d+)?\s*$/, "");
  t = t.replace(/[\s\-–—:,.]+$/, "").replace(/\s+/g, " ").trim();
  return t || stripExt(name).trim() || "Untitled";
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Keep a box inside the page and at least 1% in each dimension. Returns null for junk. */
export function clampBbox(b: unknown): [number, number, number, number] | null {
  if (!Array.isArray(b) || b.length !== 4 || b.some((v) => typeof v !== "number" || !Number.isFinite(v))) return null;
  let [x, y, w, h] = b as number[];
  x = clamp(x, 0, 1);
  y = clamp(y, 0, 1);
  w = clamp(w, 0, 1 - x);
  h = clamp(h, 0, 1 - y);
  if (w < 0.01 || h < 0.01) return null;
  return [x, y, w, h];
}

export function iou(a: number[], b: number[]): number {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[0] + a[2], b[0] + b[2]);
  const y2 = Math.min(a[1] + a[3], b[1] + b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a[2] * a[3] + b[2] * b[3] - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * A rerun must not throw away proofreading. Blocks the user edited are kept as they are,
 * and a fresh block that lands on the same spot as an edited one is dropped.
 */
export function mergeBlocks(existing: TextBlock[], fresh: TextBlock[]): TextBlock[] {
  const kept = existing.filter((b) => b.sourceEdited || b.translationEdited);
  const added = fresh.filter((f) => !kept.some((k) => iou(k.bbox, f.bbox) > 0.3));
  return [...kept, ...added].sort((a, b) => a.bbox[1] - b.bbox[1] || a.bbox[0] - b.bbox[0]);
}

/** Local calendar day key, for grouping history and updates. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayLabel(ms: number, now = Date.now()): string {
  const key = dayKey(ms);
  if (key === dayKey(now)) return "Today";
  if (key === dayKey(now - 86_400_000)) return "Yesterday";
  return new Date(ms).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h} h ${mins % 60} min`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let i = -1;
  do {
    n /= 1024;
    i++;
  } while (n >= 1024 && i < units.length - 1);
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}

/** Black or white, whichever reads better on the given rgb background. */
export function readableOn(r: number, g: number, b: number): string {
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.5 ? "#000000" : "#ffffff";
}
