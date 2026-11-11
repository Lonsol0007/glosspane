import { describe, expect, it } from "vitest";
import type { TextBlock } from "./db";
import { clampBbox, dayLabel, formatBytes, isImageName, mergeBlocks, naturalCompare, parseChapterNumber, readableOn, seriesTitleFromFilename } from "./util";

const block = (id: string, bbox: TextBlock["bbox"], extra: Partial<TextBlock> = {}): TextBlock => ({
  id, bbox, source: "s", sourceLang: "ja", translation: "t", sourceEdited: false, translationEdited: false, bg: "#fff", fg: "#000", ...extra,
});

describe("naturalCompare", () => {
  it("orders chapter 2 before chapter 10", () => {
    expect(["c10", "c2", "c1"].sort(naturalCompare)).toEqual(["c1", "c2", "c10"]);
  });
});

describe("parseChapterNumber", () => {
  it.each([["Vol.2 Ch. 10.5", 10.5], ["Series c003.cbz", 3], ["Prologue", -1], ["2020 Annual 7.zip", 7]])("%s -> %s", (name, n) => {
    expect(parseChapterNumber(name)).toBe(n);
  });
});

describe("seriesTitleFromFilename", () => {
  it.each([
    ["Night Ferry c001.cbz", "Night Ferry"],
    ["My_Series - Chapter 12 (2020) [Group].zip", "My Series"],
    ["Blue Lock v03.cbz", "Blue Lock"],
    ["Solo - 004.cbz", "Solo"],
    ["Oneshot.cbz", "Oneshot"],
    ["001.cbz", "001"],
  ])("%s -> %s", (file, title) => {
    expect(seriesTitleFromFilename(file)).toBe(title);
  });
});

describe("isImageName", () => {
  it("accepts images and rejects junk and macOS metadata", () => {
    expect(isImageName("ch1/001.JPG")).toBe(true);
    expect(isImageName("__MACOSX/ch1/001.jpg")).toBe(false);
    expect(isImageName("ch1/.hidden.png")).toBe(false);
    expect(isImageName("ComicInfo.xml")).toBe(false);
  });
});

describe("clampBbox", () => {
  it("keeps boxes inside the page", () => {
    expect(clampBbox([0.9, 0.9, 0.5, 0.5])).toEqual([0.9, 0.9, expect.closeTo(0.1), expect.closeTo(0.1)]);
    expect(clampBbox([-0.2, 0.1, 0.5, 0.2])).toEqual([0, 0.1, 0.5, 0.2]);
  });
  it("rejects junk", () => {
    expect(clampBbox([0.1, 0.1, 0.001, 0.2])).toBeNull();
    expect(clampBbox([0.1, 0.1, NaN, 0.2])).toBeNull();
    expect(clampBbox("nope")).toBeNull();
    expect(clampBbox([1, 2, 3])).toBeNull();
  });
});

describe("mergeBlocks", () => {
  it("keeps edited blocks and drops fresh ones on the same spot", () => {
    const edited = block("a", [0.1, 0.1, 0.3, 0.1], { translation: "mine", translationEdited: true });
    const untouched = block("b", [0.5, 0.5, 0.3, 0.1]);
    const fresh = [block("c", [0.11, 0.1, 0.3, 0.1]), block("d", [0.5, 0.5, 0.3, 0.1]), block("e", [0.1, 0.8, 0.2, 0.1])];
    const merged = mergeBlocks([edited, untouched], fresh);
    expect(merged.map((b) => b.id)).toEqual(["a", "d", "e"]);
    expect(merged[0].translation).toBe("mine");
  });
  it("replaces everything when nothing was edited", () => {
    expect(mergeBlocks([block("a", [0, 0, 0.2, 0.2])], [block("z", [0.5, 0.5, 0.2, 0.2])]).map((b) => b.id)).toEqual(["z"]);
  });
});

describe("formatting", () => {
  it("labels days in local time", () => {
    const now = new Date(2026, 10, 11, 12).getTime();
    expect(dayLabel(now, now)).toBe("Today");
    expect(dayLabel(now - 86_400_000, now)).toBe("Yesterday");
    // 00:30 today is still today, even though it is less than a day after 23:30 yesterday
    expect(dayLabel(new Date(2026, 10, 10, 23, 30).getTime(), new Date(2026, 10, 11, 0, 30).getTime())).toBe("Yesterday");
  });
  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(300 * 1024 * 1024)).toBe("300 MB");
  });
  it("picks readable text colours", () => {
    expect(readableOn(255, 255, 255)).toBe("#000000");
    expect(readableOn(20, 20, 40)).toBe("#ffffff");
  });
});
