import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { addCategory, clearDatabase, commitImport, deleteCategory, deleteManga, getChapters, getLibrary, getTranslation, markPreviousRead, nextUnread, restoreBackup, saveProgress, saveTranslation, setMangaCategories } from "./repo";

// fake-indexeddb cannot clone real Blobs under Node, so pages are stand-ins here. Real images are covered by the e2e suite.
const pages = (n: number) => Array.from({ length: n }, () => ({}) as Blob);
const chapter = (name: string, n = 3) => ({ url: `${name}:1`, name, pages: pages(n) });

beforeEach(clearDatabase);

describe("commitImport", () => {
  it("creates a series, orders chapters naturally and is idempotent", async () => {
    const first = await commitImport("Tide", [chapter("c10"), chapter("c2"), chapter("c1")], null);
    expect(first).toMatchObject({ added: 3, duplicates: 0 });
    expect((await getChapters(first.mangaId)).map((c) => c.name)).toEqual(["c1", "c2", "c10"]);
    const again = await commitImport("  tide ", [chapter("c2"), chapter("c11")], null);
    expect(again).toMatchObject({ mangaId: first.mangaId, added: 1, duplicates: 1 });
    expect(await db.manga.count()).toBe(1);
    expect(await db.page.count()).toBe(12);
  });
});

describe("progress", () => {
  it("saves the page, marks read on the last page and keeps one history row per chapter", async () => {
    const { mangaId } = await commitImport("Tide", [chapter("c1", 3), chapter("c2", 3)], null);
    const [c1, c2] = await getChapters(mangaId);
    await saveProgress(c1.id, 1, { incognito: false, elapsedMs: 1000 });
    await saveProgress(c1.id, 2, { incognito: false, elapsedMs: 2000 });
    expect(await db.chapter.get(c1.id)).toMatchObject({ read: true, lastPageRead: 2 });
    expect(await db.history.count()).toBe(1);
    expect((await db.history.toArray())[0].readDurationMs).toBe(3000);
    expect(nextUnread(await getChapters(mangaId))?.id).toBe(c2.id);
    const [item] = await getLibrary();
    expect(item).toMatchObject({ total: 2, unread: 1, started: true });
  });

  it("clamps out-of-range pages and writes nothing in private mode", async () => {
    const { mangaId } = await commitImport("Tide", [chapter("c1", 3)], null);
    const [c1] = await getChapters(mangaId);
    await saveProgress(c1.id, 1, { incognito: true, elapsedMs: 1000 });
    expect(await db.history.count()).toBe(0);
    expect((await db.chapter.get(c1.id))!.lastPageRead).toBe(0);
    await saveProgress(c1.id, 99, { incognito: false, elapsedMs: 0 });
    expect((await db.chapter.get(c1.id))!.lastPageRead).toBe(2);
  });

  it("marks earlier chapters read", async () => {
    const { mangaId } = await commitImport("Tide", [chapter("c1"), chapter("c2"), chapter("c3")], null);
    const list = await getChapters(mangaId);
    await markPreviousRead(list[2]);
    expect((await getChapters(mangaId)).map((c) => c.read)).toEqual([true, true, false]);
  });
});

describe("categories", () => {
  it("rejects blank and duplicate names; deleting keeps the series", async () => {
    expect(await addCategory("  ")).toBeTruthy();
    expect(await addCategory("Now")).toBeNull();
    expect(await addCategory("now")).toBeTruthy();
    const { mangaId } = await commitImport("Tide", [chapter("c1")], null);
    const [cat] = await db.category.toArray();
    await setMangaCategories([mangaId], [cat.id]);
    expect((await getLibrary())[0].categoryIds).toEqual([cat.id]);
    await deleteCategory(cat.id);
    expect((await getLibrary())[0].categoryIds).toEqual([]);
    expect(await db.manga.count()).toBe(1);
  });
});

describe("translations", () => {
  it("upserts one row per page and language, and is removed with the series", async () => {
    const { mangaId } = await commitImport("Tide", [chapter("c1")], null);
    const [c1] = await getChapters(mangaId);
    await saveTranslation(c1.id, 0, "English", "m", []);
    await saveTranslation(c1.id, 0, "English", "m2", []);
    await saveTranslation(c1.id, 0, "Spanish", "m", []);
    expect(await db.translation.count()).toBe(2);
    expect((await getTranslation(c1.id, 0, "English"))!.model).toBe("m2");
    await deleteManga([mangaId]);
    expect(await db.translation.count()).toBe(0);
    expect(await db.page.count()).toBe(0);
  });
});

describe("restoreBackup", () => {
  it("refuses files that are not backups, and newer versions", async () => {
    await expect(restoreBackup({ hello: 1 })).rejects.toThrow("not a backup");
    await expect(restoreBackup({ format: "reader-backup", version: 99 })).rejects.toThrow("newer version");
    await expect(restoreBackup({ format: "reader-backup", version: 1, manga: "x" })).rejects.toThrow("damaged");
  });
});
