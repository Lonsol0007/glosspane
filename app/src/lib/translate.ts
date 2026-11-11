"use client";
import { useSyncExternalStore } from "react";
import { db, type TextBlock } from "./db";
import { isNative } from "./platform";
import { getApiKey, getPrefs } from "./prefs";
import { getTranslation, saveTranslation, updateBlock } from "./repo";
import { clampBbox, mergeBlocks, readableOn } from "./util";

const MAX_EDGE = 1568;

/** Android build: no server route exists, so call the provider from the app with the stored key. */
async function direct<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const key = getApiKey();
  if (!key) throw new Error("No API key. Add your key in translation settings.");
  if (!navigator.onLine) throw new Error("No connection. Translation needs the internet; reading does not.");
  const translator = await import("./server/translator");
  if (path === "/api/translate") return { blocks: await translator.translatePageImage(key, body as never) } as T;
  return { translations: await translator.translateTexts(key, body as never) } as T;
}

async function post<T>(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  if (isNative) return direct<T>(path, body);
  const key = getApiKey();
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", ...(key ? { "x-api-key": key } : {}) },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new Error("No connection. Translation needs the internet; reading does not.");
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? `Translation failed (${res.status}).`);
  return json as T;
}

/** Downscale to what the model can use and re-encode as JPEG. Returns the canvas too, for colour sampling. */
async function prepare(blob: Blob): Promise<{ base64: string; canvas: HTMLCanvasElement }> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d", { willReadFrequently: true })!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { base64: dataUrl.slice(dataUrl.indexOf(",") + 1), canvas };
}

/**
 * The "cleanup" stage. Instead of inpainting, take the median colour around the edge of the
 * text box (the bubble's own colour in almost every case) and paint the box with it.
 */
export function sampleBackground(canvas: HTMLCanvasElement, bbox: [number, number, number, number]): { bg: string; fg: string } {
  const x = Math.floor(bbox[0] * canvas.width);
  const y = Math.floor(bbox[1] * canvas.height);
  const w = Math.max(2, Math.floor(bbox[2] * canvas.width));
  const h = Math.max(2, Math.floor(bbox[3] * canvas.height));
  const { data } = canvas.getContext("2d", { willReadFrequently: true })!.getImageData(x, y, w, h);
  const channels: number[][] = [[], [], []];
  const take = (px: number, py: number) => {
    const i = (py * w + px) * 4;
    for (let c = 0; c < 3; c++) channels[c].push(data[i + c]);
  };
  for (let px = 0; px < w; px += 2) {
    take(px, 0);
    take(px, h - 1);
  }
  for (let py = 0; py < h; py += 2) {
    take(0, py);
    take(w - 1, py);
  }
  const [r, g, b] = channels.map((list) => list.sort((p, q) => p - q)[Math.floor(list.length / 2)] ?? 255);
  return { bg: `rgb(${r}, ${g}, ${b})`, fg: readableOn(r, g, b) };
}

interface ApiBlock {
  bbox: unknown;
  source: string;
  sourceLang: string;
  translation: string;
}

/** Detect, read, translate and clean one page, then save it. A rerun keeps blocks the user edited. */
export async function translatePage(chapterId: number, pageIndex: number, signal?: AbortSignal): Promise<number> {
  const { targetLang, translationModel } = getPrefs();
  const page = await db.page.where("[chapterId+index]").equals([chapterId, pageIndex]).first();
  if (!page) throw new Error("That page is missing from this device.");
  const { base64, canvas } = await prepare(page.blob);
  const { blocks } = await post<{ blocks: ApiBlock[] }>("/api/translate", { image: base64, mediaType: "image/jpeg", targetLang, model: translationModel }, signal);
  if (signal?.aborted) throw new DOMException("Stopped", "AbortError");
  const fresh: TextBlock[] = blocks.flatMap((b) => {
    const bbox = clampBbox(b.bbox);
    if (!bbox || !b.source?.trim()) return [];
    return [{ id: crypto.randomUUID(), bbox, source: b.source, sourceLang: b.sourceLang ?? "", translation: b.translation ?? "", sourceEdited: false, translationEdited: false, ...sampleBackground(canvas, bbox) }];
  });
  const existing = await getTranslation(chapterId, pageIndex, targetLang);
  const merged = mergeBlocks(existing?.blocks ?? [], fresh);
  await saveTranslation(chapterId, pageIndex, targetLang, translationModel, merged);
  return merged.length;
}

export async function retranslateBlock(translationId: number, block: TextBlock) {
  const { targetLang, translationModel } = getPrefs();
  const { translations } = await post<{ translations: string[] }>("/api/translate/text", { texts: [block.source], targetLang, model: translationModel });
  await updateBlock(translationId, block.id, { translation: translations[0] ?? "", translationEdited: false });
}

// ---------- the job: one at a time, stoppable, commits page by page ----------

export interface JobState {
  running: boolean;
  chapterId: number | null;
  done: number;
  total: number;
  failed: number;
  error: string | null;
}

let state: JobState = { running: false, chapterId: null, done: 0, total: 0, failed: 0, error: null };
let controller: AbortController | null = null;
const listeners = new Set<() => void>();
const set = (patch: Partial<JobState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export function useTranslateJob(): JobState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export function stopJob() {
  controller?.abort();
}

/**
 * Translate the given pages in order. With skipDone, pages that already have a
 * translation in the target language are left alone (used for whole-chapter runs).
 */
export async function runJob(chapterId: number, pageIndexes: number[], opts: { skipDone: boolean }) {
  if (state.running) return;
  controller = new AbortController();
  const { signal } = controller;
  set({ running: true, chapterId, done: 0, total: pageIndexes.length, failed: 0, error: null });
  const { targetLang } = getPrefs();
  for (const index of pageIndexes) {
    if (signal.aborted) break;
    try {
      if (!(opts.skipDone && (await getTranslation(chapterId, index, targetLang)))) await translatePage(chapterId, index, signal);
      set({ done: state.done + 1 });
    } catch (e) {
      if (signal.aborted) break;
      const message = e instanceof Error ? e.message : "Translation failed.";
      set({ failed: state.failed + 1, done: state.done + 1, error: message });
      // A bad key, missing key or rate limit will fail every page; stop instead of burning through the chapter.
      if (/key|limit|connection/i.test(message)) break;
    }
  }
  set({ running: false });
}
