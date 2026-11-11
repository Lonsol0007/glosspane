"use client";
import { useSyncExternalStore } from "react";

export const defaultPrefs = {
  theme: "system" as "system" | "light" | "dark",
  libraryDisplay: "comfortable" as "compact" | "comfortable" | "list",
  librarySort: "title" as "title" | "lastRead" | "dateAdded" | "unread",
  librarySortDesc: false,
  filterUnread: false,
  filterStarted: false,
  filterCompleted: false,
  filterBookmarked: false,
  chapterSortDesc: true,
  chapterFilterUnread: false,
  chapterFilterBookmarked: false,
  readingMode: "rtl" as "ltr" | "rtl" | "vertical" | "webtoon",
  scaleType: "fit-screen" as "fit-screen" | "fit-width" | "fit-height" | "original",
  readerBackground: "black" as "black" | "gray" | "white",
  tapZones: true,
  showPageNumber: true,
  incognito: false,
  // translation
  targetLang: "English",
  translationModel: "claude-opus-5-5",
  translationFont: "comic" as "comic" | "sans",
  cleanBubbles: true,
  autoTranslate: false,
  showTranslation: true,
};

export type Prefs = typeof defaultPrefs;

const KEY = "prefs";
const listeners = new Set<() => void>();
let cache: Prefs | null = null;

function read(): Prefs {
  if (cache) return cache;
  let stored: Partial<Prefs> = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    // unreadable prefs fall back to defaults
  }
  cache = { ...defaultPrefs, ...stored };
  return cache;
}

export function getPrefs(): Prefs {
  return typeof window === "undefined" ? defaultPrefs : read();
}

export function setPrefs(patch: Partial<Prefs>) {
  cache = { ...read(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function resetPrefsCache() {
  cache = null;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, read, () => defaultPrefs);
}

// The provider key is kept apart from prefs so it never ends up in a backup file.
const KEY_API = "provider-key";
export const getApiKey = () => (typeof window === "undefined" ? "" : localStorage.getItem(KEY_API) ?? "");
export function setApiKey(value: string) {
  if (value) localStorage.setItem(KEY_API, value);
  else localStorage.removeItem(KEY_API);
  listeners.forEach((l) => l());
}
export function useApiKey(): string {
  return useSyncExternalStore(subscribe, getApiKey, () => "");
}

export const LANGUAGES = [
  "English", "Spanish", "Portuguese", "French", "German", "Italian", "Indonesian", "Vietnamese",
  "Thai", "Hindi", "Arabic", "Russian", "Turkish", "Polish", "Chinese (Simplified)", "Korean", "Japanese",
];
