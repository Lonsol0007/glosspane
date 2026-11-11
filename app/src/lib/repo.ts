import { z } from "zod";
import { db, type Chapter, type Manga, type PageTranslation, type TextBlock } from "./db";
import { naturalCompare, parseChapterNumber } from "./util";

// ---------- import ----------

export interface ImportChapter {
  url: string;
  name: string;
  pages: Blob[];
}

export interface ImportResult {
  mangaId: number;
  added: number;
  duplicates: number;
}

/**
 * Adds chapters to a series, creating the series when the title is new.
 * Importing the same file twice is a no-op; importing a file for a chapter that
 * was restored from a backup (no pages yet) attaches the pages and keeps progress.
 */
export async function commitImport(title: string, chapters: ImportChapter[], cover: Blob | null): Promise<ImportResult> {
  const cleanTitle = title.trim() || "Untitled";
  const key = cleanTitle.toLowerCase();
  return db.transaction("rw", db.manga, db.chapter, db.page, async () => {
    let manga = await db.manga.where("[source+url]").equals(["local", key]).first();
    if (!manga) {
      const id = await db.manga.add({
        source: "local", url: key, title: cleanTitle, author: "", artist: "", description: "",
        genre: [], status: "unknown", cover, favorite: true, dateAdded: Date.now(), notes: "", readingMode: "default",
      });
      manga = (await db.manga.get(id))!;
    } else {
      await db.manga.update(manga.id, { favorite: true, ...(manga.cover ? {} : { cover }) });
    }
    let added = 0;
    let duplicates = 0;
    for (const ch of chapters) {
      const existing = await db.chapter.where("[mangaId+url]").equals([manga.id, ch.url]).first();
      let chapterId: number;
      if (existing) {
        const havePages = await db.page.where("chapterId").equals(existing.id).count();
        if (havePages > 0) {
          duplicates++;
          continue;
        }
        chapterId = existing.id;
        await db.chapter.update(chapterId, { pageCount: ch.pages.length });
      } else {
        chapterId = await db.chapter.add({
          mangaId: manga.id, url: ch.url, name: ch.name, chapterNumber: parseChapterNumber(ch.name),
          sourceOrder: 0, pageCount: ch.pages.length, read: false, bookmark: false, lastPageRead: 0, dateFetch: Date.now(),
        });
      }
      await db.page.bulkAdd(ch.pages.map((blob, index) => ({ chapterId, index, blob })));
      added++;
    }
    const all = await db.chapter.where("mangaId").equals(manga.id).toArray();
    all.sort((a, b) => naturalCompare(a.name, b.name));
    await Promise.all(all.map((c, i) => (c.sourceOrder === i ? null : db.chapter.update(c.id, { sourceOrder: i }))));
    return { mangaId: manga.id, added, duplicates };
  });
}

// ---------- library ----------

export interface LibraryItem {
  manga: Manga;
  total: number;
  unread: number;
  started: boolean;
  bookmarked: boolean;
  lastRead: number;
  categoryIds: number[];
}

export async function getLibrary(): Promise<LibraryItem[]> {
  const [mangas, chapters, history, links] = await Promise.all([
    db.manga.toArray(), db.chapter.toArray(), db.history.toArray(), db.mangaCategory.toArray(),
  ]);
  const items = new Map<number, LibraryItem>();
  for (const manga of mangas) {
    if (manga.favorite) items.set(manga.id, { manga, total: 0, unread: 0, started: false, bookmarked: false, lastRead: 0, categoryIds: [] });
  }
  for (const c of chapters) {
    const it = items.get(c.mangaId);
    if (!it) continue;
    it.total++;
    if (!c.read) it.unread++;
    if (c.read || c.lastPageRead > 0) it.started = true;
    if (c.bookmark) it.bookmarked = true;
  }
  for (const h of history) {
    const it = items.get(h.mangaId);
    if (it) it.lastRead = Math.max(it.lastRead, h.readAt);
  }
  for (const l of links) items.get(l.mangaId)?.categoryIds.push(l.categoryId);
  return [...items.values()];
}

export async function getChapters(mangaId: number): Promise<Chapter[]> {
  const list = await db.chapter.where("mangaId").equals(mangaId).toArray();
  return list.sort((a, b) => a.sourceOrder - b.sourceOrder);
}

/** The chapter to open from "Start" / "Resume": the first one that is not finished. */
export function nextUnread(chapters: Chapter[]): Chapter | undefined {
  return chapters.find((c) => !c.read) ?? undefined;
}

export async function setChaptersRead(ids: number[], read: boolean) {
  await db.chapter.where("id").anyOf(ids).modify(read ? { read: true } : { read: false, lastPageRead: 0 });
}

export async function markPreviousRead(chapter: Chapter) {
  await db.chapter.where("mangaId").equals(chapter.mangaId).and((c) => c.sourceOrder < chapter.sourceOrder).modify({ read: true });
}

export async function setMangaRead(mangaIds: number[], read: boolean) {
  await db.chapter.where("mangaId").anyOf(mangaIds).modify(read ? { read: true } : { read: false, lastPageRead: 0 });
}

export async function deleteChapters(ids: number[]) {
  await db.transaction("rw", db.chapter, db.page, db.history, db.translation, async () => {
    await db.page.where("chapterId").anyOf(ids).delete();
    await db.history.where("chapterId").anyOf(ids).delete();
    await db.translation.where("chapterId").anyOf(ids).delete();
    await db.chapter.bulkDelete(ids);
  });
}

export async function deleteManga(mangaIds: number[]) {
  const chapterIds = (await db.chapter.where("mangaId").anyOf(mangaIds).primaryKeys()) as number[];
  await deleteChapters(chapterIds);
  await db.transaction("rw", db.manga, db.mangaCategory, async () => {
    await db.mangaCategory.where("mangaId").anyOf(mangaIds).delete();
    await db.manga.bulkDelete(mangaIds);
  });
}

// ---------- reading progress ----------

export async function saveProgress(chapterId: number, pageIndex: number, opts: { incognito: boolean; elapsedMs: number }) {
  await db.transaction("rw", db.chapter, db.history, async () => {
    const chapter = await db.chapter.get(chapterId);
    if (!chapter) return;
    const last = Math.max(0, chapter.pageCount - 1);
    const page = Math.min(Math.max(0, pageIndex), last);
    if (opts.incognito) return;
    await db.chapter.update(chapterId, page >= last ? { read: true, lastPageRead: page } : { lastPageRead: page });
    const existing = await db.history.where("chapterId").equals(chapterId).first();
    if (existing) {
      await db.history.update(existing.id, { readAt: Date.now(), readDurationMs: existing.readDurationMs + opts.elapsedMs });
    } else {
      await db.history.add({ mangaId: chapter.mangaId, chapterId, readAt: Date.now(), readDurationMs: opts.elapsedMs });
    }
  });
}

// ---------- categories ----------

export async function addCategory(name: string): Promise<string | null> {
  const clean = name.trim();
  if (!clean) return "Give the category a name.";
  const all = await db.category.toArray();
  if (all.some((c) => c.name.toLowerCase() === clean.toLowerCase())) return "A category with that name already exists.";
  await db.category.add({ name: clean, sort: all.reduce((m, c) => Math.max(m, c.sort), -1) + 1 });
  return null;
}

export async function renameCategory(id: number, name: string): Promise<string | null> {
  const clean = name.trim();
  if (!clean) return "Give the category a name.";
  const all = await db.category.toArray();
  if (all.some((c) => c.id !== id && c.name.toLowerCase() === clean.toLowerCase())) return "A category with that name already exists.";
  await db.category.update(id, { name: clean });
  return null;
}

export async function moveCategory(id: number, direction: -1 | 1) {
  const all = await db.category.orderBy("sort").toArray();
  const i = all.findIndex((c) => c.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= all.length) return;
  await db.transaction("rw", db.category, async () => {
    await db.category.update(all[i].id, { sort: all[j].sort });
    await db.category.update(all[j].id, { sort: all[i].sort });
  });
}

/** Deleting a category keeps its series; they fall back to the default tab. */
export async function deleteCategory(id: number) {
  await db.transaction("rw", db.category, db.mangaCategory, async () => {
    await db.mangaCategory.where("categoryId").equals(id).delete();
    await db.category.delete(id);
  });
}

export async function setMangaCategories(mangaIds: number[], categoryIds: number[]) {
  await db.transaction("rw", db.mangaCategory, async () => {
    await db.mangaCategory.where("mangaId").anyOf(mangaIds).delete();
    await db.mangaCategory.bulkAdd(mangaIds.flatMap((mangaId) => categoryIds.map((categoryId) => ({ mangaId, categoryId }))));
  });
}

// ---------- translations ----------

export function getTranslation(chapterId: number, pageIndex: number, targetLang: string) {
  return db.translation.where("[chapterId+pageIndex+targetLang]").equals([chapterId, pageIndex, targetLang]).first();
}

export async function saveTranslation(chapterId: number, pageIndex: number, targetLang: string, model: string, blocks: TextBlock[]) {
  await db.transaction("rw", db.translation, async () => {
    const existing = await getTranslation(chapterId, pageIndex, targetLang);
    if (existing) await db.translation.update(existing.id, { blocks, model, updatedAt: Date.now() });
    else await db.translation.add({ chapterId, pageIndex, targetLang, model, blocks, updatedAt: Date.now() });
  });
}

export async function updateBlock(translationId: number, blockId: string, patch: Partial<TextBlock>) {
  await db.translation.where("id").equals(translationId).modify((t) => {
    t.blocks = t.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b));
    t.updatedAt = Date.now();
  });
}

export async function deleteBlock(translationId: number, blockId: string) {
  await db.translation.where("id").equals(translationId).modify((t) => {
    t.blocks = t.blocks.filter((b) => b.id !== blockId);
  });
}

// ---------- backup ----------

const blockSchema = z.object({
  id: z.string(), bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  source: z.string(), sourceLang: z.string(), translation: z.string(),
  sourceEdited: z.boolean(), translationEdited: z.boolean(), bg: z.string(), fg: z.string(),
});

const backupSchema = z.object({
  format: z.literal("reader-backup"),
  version: z.number().int().min(1),
  exportedAt: z.number(),
  manga: z.array(z.object({
    id: z.number(), source: z.string(), url: z.string(), title: z.string(), author: z.string(), artist: z.string(),
    description: z.string(), genre: z.array(z.string()), status: z.enum(["unknown", "ongoing", "completed", "hiatus", "cancelled"]),
    cover: z.string().nullable(), favorite: z.boolean(), dateAdded: z.number(), notes: z.string(),
    readingMode: z.enum(["default", "ltr", "rtl", "vertical", "webtoon"]),
  })),
  chapters: z.array(z.object({
    id: z.number(), mangaId: z.number(), url: z.string(), name: z.string(), chapterNumber: z.number(), sourceOrder: z.number(),
    pageCount: z.number(), read: z.boolean(), bookmark: z.boolean(), lastPageRead: z.number(), dateFetch: z.number(),
  })),
  categories: z.array(z.object({ id: z.number(), name: z.string(), sort: z.number() })),
  mangaCategories: z.array(z.object({ mangaId: z.number(), categoryId: z.number() })),
  history: z.array(z.object({ mangaId: z.number(), chapterId: z.number(), readAt: z.number(), readDurationMs: z.number() })),
  translations: z.array(z.object({
    chapterId: z.number(), pageIndex: z.number(), targetLang: z.string(), model: z.string(),
    blocks: z.array(blockSchema), updatedAt: z.number(),
  })),
  prefs: z.record(z.string(), z.unknown()).optional(),
});

export type Backup = z.infer<typeof backupSchema>;
export const BACKUP_VERSION = 1;

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

const dataUrlToBlob = async (url: string) => (url.startsWith("data:image/") ? (await fetch(url)).blob() : null);

/** Everything except the page images: those stay on the device and are re-attached by importing the files again. */
export async function exportBackup(prefs: Record<string, unknown>): Promise<Backup> {
  const [manga, chapters, categories, mangaCategories, history, translations] = await Promise.all([
    db.manga.toArray(), db.chapter.toArray(), db.category.toArray(), db.mangaCategory.toArray(),
    db.history.toArray(), db.translation.toArray(),
  ]);
  return {
    format: "reader-backup",
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    manga: await Promise.all(manga.map(async (m) => ({ ...m, cover: m.cover ? await blobToDataUrl(m.cover) : null }))),
    chapters,
    categories,
    mangaCategories,
    history: history.map(({ mangaId, chapterId, readAt, readDurationMs }) => ({ mangaId, chapterId, readAt, readDurationMs })),
    translations: translations.map(({ chapterId, pageIndex, targetLang, model, blocks, updatedAt }) => ({ chapterId, pageIndex, targetLang, model, blocks, updatedAt })),
    prefs,
  };
}

export interface RestoreSummary {
  manga: number;
  chapters: number;
  categories: number;
  prefs: Record<string, unknown> | undefined;
}

/** Merges a backup into the current data. Existing series and chapters are matched by key and updated. */
export async function restoreBackup(raw: unknown): Promise<RestoreSummary> {
  const head = z.object({ format: z.literal("reader-backup"), version: z.number() }).safeParse(raw);
  if (!head.success) throw new Error("This file is not a backup made by this app.");
  if (head.data.version > BACKUP_VERSION) throw new Error("This backup was made by a newer version of the app. Update, then try again.");
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) throw new Error("The backup file is damaged or incomplete.");
  const data = parsed.data;
  const covers = new Map<number, Blob | null>();
  for (const m of data.manga) covers.set(m.id, m.cover ? await dataUrlToBlob(m.cover) : null);

  await db.transaction("rw", [db.manga, db.chapter, db.category, db.mangaCategory, db.history, db.translation], async () => {
    const mangaMap = new Map<number, number>();
    for (const { id, cover: _cover, ...m } of data.manga) {
      void _cover;
      const existing = await db.manga.where("[source+url]").equals([m.source, m.url]).first();
      if (existing) {
        await db.manga.update(existing.id, { ...m, cover: existing.cover ?? covers.get(id) ?? null });
        mangaMap.set(id, existing.id);
      } else {
        mangaMap.set(id, await db.manga.add({ ...m, cover: covers.get(id) ?? null }));
      }
    }
    const chapterMap = new Map<number, number>();
    for (const { id, ...c } of data.chapters) {
      const mangaId = mangaMap.get(c.mangaId);
      if (mangaId === undefined) continue;
      const existing = await db.chapter.where("[mangaId+url]").equals([mangaId, c.url]).first();
      if (existing) {
        await db.chapter.update(existing.id, { read: c.read, bookmark: c.bookmark, lastPageRead: c.lastPageRead });
        chapterMap.set(id, existing.id);
      } else {
        // Pages are not in a backup, so a restored chapter starts with none until its file is added again.
        chapterMap.set(id, await db.chapter.add({ ...c, mangaId, pageCount: 0 }));
      }
    }
    const categoryMap = new Map<number, number>();
    const currentCats = await db.category.toArray();
    let nextSort = currentCats.reduce((m, c) => Math.max(m, c.sort), -1) + 1;
    for (const c of [...data.categories].sort((a, b) => a.sort - b.sort)) {
      const existing = currentCats.find((x) => x.name.toLowerCase() === c.name.toLowerCase());
      categoryMap.set(c.id, existing ? existing.id : await db.category.add({ name: c.name, sort: nextSort++ }));
    }
    for (const l of data.mangaCategories) {
      const mangaId = mangaMap.get(l.mangaId);
      const categoryId = categoryMap.get(l.categoryId);
      if (mangaId !== undefined && categoryId !== undefined) await db.mangaCategory.put({ mangaId, categoryId });
    }
    for (const h of data.history) {
      const mangaId = mangaMap.get(h.mangaId);
      const chapterId = chapterMap.get(h.chapterId);
      if (mangaId === undefined || chapterId === undefined) continue;
      const existing = await db.history.where("chapterId").equals(chapterId).first();
      if (existing) await db.history.update(existing.id, { readAt: Math.max(existing.readAt, h.readAt) });
      else await db.history.add({ ...h, mangaId, chapterId });
    }
    for (const t of data.translations) {
      const chapterId = chapterMap.get(t.chapterId);
      if (chapterId === undefined) continue;
      const existing = await db.translation.where("[chapterId+pageIndex+targetLang]").equals([chapterId, t.pageIndex, t.targetLang]).first();
      if (existing) await db.translation.update(existing.id, { ...t, chapterId });
      else await db.translation.add({ ...t, chapterId });
    }
  });
  return { manga: data.manga.length, chapters: data.chapters.length, categories: data.categories.length, prefs: data.prefs };
}

export async function clearDatabase() {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
}
