import Dexie, { type EntityTable, type Table } from "dexie";

// Mirrors replica/schema.sql. Numeric ids locally; times are epoch ms in UTC.

export type ReadingMode = "default" | "ltr" | "rtl" | "vertical" | "webtoon";
export type MangaStatus = "unknown" | "ongoing" | "completed" | "hiatus" | "cancelled";

export interface Manga {
  id: number;
  source: string;
  url: string;
  title: string;
  author: string;
  artist: string;
  description: string;
  genre: string[];
  status: MangaStatus;
  cover: Blob | null;
  favorite: boolean;
  dateAdded: number;
  notes: string;
  readingMode: ReadingMode;
}

export interface Chapter {
  id: number;
  mangaId: number;
  url: string;
  name: string;
  chapterNumber: number;
  sourceOrder: number;
  pageCount: number;
  read: boolean;
  bookmark: boolean;
  lastPageRead: number;
  dateFetch: number;
}

export interface Page {
  id: number;
  chapterId: number;
  index: number;
  blob: Blob;
}

export interface Category {
  id: number;
  name: string;
  sort: number;
}

export interface MangaCategory {
  mangaId: number;
  categoryId: number;
}

export interface History {
  id: number;
  mangaId: number;
  chapterId: number;
  readAt: number;
  readDurationMs: number;
}

export interface TextBlock {
  id: string;
  /** x, y, width, height as fractions of the page (0..1) */
  bbox: [number, number, number, number];
  source: string;
  sourceLang: string;
  translation: string;
  sourceEdited: boolean;
  translationEdited: boolean;
  bg: string;
  fg: string;
}

export interface PageTranslation {
  id: number;
  chapterId: number;
  pageIndex: number;
  targetLang: string;
  model: string;
  blocks: TextBlock[];
  updatedAt: number;
}

export class AppDB extends Dexie {
  manga!: EntityTable<Manga, "id">;
  chapter!: EntityTable<Chapter, "id">;
  page!: EntityTable<Page, "id">;
  category!: EntityTable<Category, "id">;
  mangaCategory!: Table<MangaCategory, [number, number]>;
  history!: EntityTable<History, "id">;
  translation!: EntityTable<PageTranslation, "id">;

  constructor(name = "reader-db") {
    super(name);
    this.version(1).stores({
      manga: "++id, &[source+url], title, dateAdded",
      chapter: "++id, mangaId, &[mangaId+url], dateFetch",
      page: "++id, chapterId, &[chapterId+index]",
      category: "++id, sort",
      mangaCategory: "[mangaId+categoryId], mangaId, categoryId",
      history: "++id, &chapterId, mangaId, readAt",
      translation: "++id, chapterId, &[chapterId+pageIndex+targetLang]",
    });
  }
}

export const db = new AppDB();
