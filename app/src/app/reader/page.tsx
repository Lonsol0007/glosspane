"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Eye, EyeOff, Languages, SearchX, Settings2, SkipBack, SkipForward } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { TranslatePanel, TranslationOverlay } from "@/components/Translation";
import { EmptyState, IconButton, Segmented, Sheet, Switch, useToast } from "@/components/ui";
import { db, type ReadingMode } from "@/lib/db";
import { isNative } from "@/lib/platform";
import { getApiKey, setPrefs, usePrefs, type Prefs } from "@/lib/prefs";
import { getChapters, getTranslation, saveProgress } from "@/lib/repo";
import { runJob } from "@/lib/translate";

const scaleStyles: Record<Prefs["scaleType"], React.CSSProperties> = {
  "fit-screen": { maxWidth: "100vw", maxHeight: "100dvh", width: "auto", height: "auto" },
  "fit-width": { width: "100vw", height: "auto" },
  "fit-height": { height: "100dvh", width: "auto", maxWidth: "none" },
  original: { maxWidth: "none" },
};
const backgrounds: Record<Prefs["readerBackground"], string> = { black: "#000000", gray: "#2b2b2b", white: "#ffffff" };

export default function ReaderPage() {
  return <Suspense><ReaderView /></Suspense>;
}

function ReaderView() {
  const chapterId = Number(useSearchParams().get("c") ?? NaN);
  const router = useRouter();
  const toast = useToast();
  const prefs = usePrefs();

  const data = useLiveQuery(async () => {
    const chapter = Number.isInteger(chapterId) ? await db.chapter.get(chapterId) : undefined;
    if (!chapter) return { chapter: null, manga: null, siblings: [] };
    return { chapter, manga: (await db.manga.get(chapter.mangaId)) ?? null, siblings: await getChapters(chapter.mangaId) };
  }, [chapterId]);

  const [urls, setUrls] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [menu, setMenu] = useState(true);
  const [settings, setSettings] = useState(false);
  const [panel, setPanel] = useState(false);
  const [broken, setBroken] = useState<Set<number>>(new Set());
  const [serverKey, setServerKey] = useState(false);
  const lastSave = useRef(Date.now());
  const scroller = useRef<HTMLDivElement>(null);

  // Load the chapter's pages once, and start where the reader stopped.
  useEffect(() => {
    let cancelled = false;
    let made: string[] = [];
    setUrls(null);
    setBroken(new Set());
    (async () => {
      const [chapter, pages] = await Promise.all([db.chapter.get(chapterId), db.page.where("chapterId").equals(chapterId).sortBy("index")]);
      if (cancelled) return;
      made = pages.map((p) => URL.createObjectURL(p.blob));
      setIndex(chapter && !chapter.read ? Math.min(chapter.lastPageRead, Math.max(0, pages.length - 1)) : 0);
      lastSave.current = Date.now();
      setUrls(made);
    })();
    return () => {
      cancelled = true;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [chapterId]);

  useEffect(() => {
    if (isNative) return;
    fetch("/api/health").then((r) => r.json()).then((j) => setServerKey(!!j.serverKey)).catch(() => {});
  }, []);

  const count = urls?.length ?? 0;
  const mode: Exclude<ReadingMode, "default"> = data?.manga && data.manga.readingMode !== "default" ? data.manga.readingMode : prefs.readingMode;
  const rtl = mode === "rtl";
  const position = data?.siblings.findIndex((c) => c.id === chapterId) ?? -1;
  const prevChapter = position > 0 ? data!.siblings[position - 1] : null;
  const nextChapter = position >= 0 && position < data!.siblings.length - 1 ? data!.siblings[position + 1] : null;

  // Save progress whenever the page changes.
  useEffect(() => {
    if (!count) return;
    const now = Date.now();
    const elapsedMs = Math.min(now - lastSave.current, 5 * 60_000);
    lastSave.current = now;
    saveProgress(chapterId, index, { incognito: prefs.incognito, elapsedMs });
  }, [chapterId, index, count, prefs.incognito]);

  // Auto-translate a page the first time it is opened, when switched on.
  useEffect(() => {
    if (!count || !prefs.autoTranslate || !(getApiKey() || serverKey)) return;
    getTranslation(chapterId, index, prefs.targetLang).then((t) => {
      if (!t) runJob(chapterId, [index], { skipDone: true });
    });
  }, [chapterId, index, count, prefs.autoTranslate, prefs.targetLang, serverKey]);

  const scrollToPage = useCallback((i: number) => {
    scroller.current?.querySelector(`[data-page="${i}"]`)?.scrollIntoView({ block: "start" });
  }, []);

  const jump = useCallback((i: number) => {
    setIndex(i);
    if (mode === "webtoon") scrollToPage(i);
  }, [mode, scrollToPage]);

  const go = useCallback((delta: number) => {
    const next = index + delta;
    if (next < 0) {
      if (prevChapter) router.replace(`/reader?c=${prevChapter.id}`);
      else toast("This is the first page.");
    } else if (next >= count) {
      if (nextChapter) router.replace(`/reader?c=${nextChapter.id}`);
      else toast("You have reached the end of the last chapter.");
    } else jump(next);
  }, [index, count, prevChapter, nextChapter, router, toast, jump]);

  // Webtoon: land on the saved page, then follow scrolling.
  useEffect(() => {
    if (mode !== "webtoon" || !urls) return;
    scrollToPage(index);
    const root = scroller.current;
    if (!root) return;
    const observer = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (top) setIndex(Number((top.target as HTMLElement).dataset.page));
    }, { root, rootMargin: "-45% 0px -45% 0px" });
    root.querySelectorAll("[data-page]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, urls]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settings || panel || (e.target as HTMLElement).closest("input, textarea, select")) return;
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const back = rtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === "m" || e.key === "Enter") setMenu((m) => !m);
      else if (mode === "webtoon") return;
      else if (e.key === forward || e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(1); }
      else if (e.key === back || e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, rtl, mode, settings, panel]);

  if (!data) return <div className="min-h-dvh bg-reader-bg" />;
  if (!data.chapter || !data.manga) {
    return <EmptyState icon={<SearchX size={56} />} title="Chapter not found" body="It may have been deleted from this device." action={<Link href="/" className="font-semibold text-accent">Back to library</Link>} />;
  }
  const { chapter, manga } = data;

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!prefs.tapZones || mode === "webtoon") return setMenu((m) => !m);
    const rect = e.currentTarget.getBoundingClientRect();
    const f = mode === "vertical" ? (e.clientY - rect.top) / rect.height : (e.clientX - rect.left) / rect.width;
    if (f > 1 / 3 && f < 2 / 3) return setMenu((m) => !m);
    const forward = mode === "vertical" ? f >= 2 / 3 : rtl ? f <= 1 / 3 : f >= 2 / 3;
    go(forward ? 1 : -1);
  };

  const pageImage = (i: number, style: React.CSSProperties) => (
    <div className="relative w-fit shrink-0" data-page={i} style={{ minHeight: broken.has(i) ? undefined : 1 }}>
      {broken.has(i) ? (
        <div role="alert" className="flex h-[60dvh] w-[min(100vw,480px)] items-center justify-center p-6 text-center text-reader-text">Page {i + 1} could not be shown. The image file may be damaged.</div>
      ) : (
        <>
          <img src={urls![i]} alt={`Page ${i + 1} of ${count}`} style={style} className="block select-none" draggable={false} onError={() => setBroken((s) => new Set(s).add(i))} />
          <TranslationOverlay chapterId={chapterId} pageIndex={i} />
        </>
      )}
    </div>
  );

  return (
    <main className="fixed inset-0 text-reader-text" style={{ background: backgrounds[prefs.readerBackground] }}>
      {urls === null ? (
        <div className="flex h-full items-center justify-center" role="status" aria-label="Loading pages"><span className="h-8 w-8 animate-spin rounded-full border-2 border-reader-text border-t-transparent" /></div>
      ) : count === 0 ? (
        <div className="flex h-full items-center justify-center p-6 text-center">This chapter has no pages on this device. Add its file again from the Add tab to attach them.</div>
      ) : mode === "webtoon" ? (
        <div ref={scroller} data-testid="reader-view" onClick={onTap} className="flex h-full flex-col items-center overflow-y-auto">
          {urls.map((_, i) => <div key={i}>{pageImage(i, { width: "min(100vw, 900px)", height: "auto" })}</div>)}
        </div>
      ) : (
        <div data-testid="reader-view" onClick={onTap} className="flex h-full w-full overflow-auto">
          <div className="m-auto">{pageImage(index, scaleStyles[prefs.scaleType])}</div>
          {index + 1 < count && <link rel="preload" as="image" href={urls[index + 1]} />}
        </div>
      )}

      {!menu && prefs.showPageNumber && count > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-2 text-center text-xs font-semibold" style={{ textShadow: "0 0 3px #000, 0 0 3px #000", color: "#fff" }} aria-hidden>{index + 1} / {count}</div>
      )}

      {menu && (
        <>
          <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-1 bg-reader-bg/90 px-2 text-reader-text">
            <Link href={`/manga?id=${manga.id}`} aria-label="Back to series" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15"><ArrowLeft size={22} /></Link>
            <div className="min-w-0 flex-1 px-2">
              <p className="truncate font-semibold">{manga.title}</p>
              <p className="truncate text-xs opacity-80">{chapter.name}{prefs.incognito ? " · private" : ""}</p>
            </div>
            <IconButton label={prefs.showTranslation ? "Show original" : "Show translation"} className="hover:bg-white/15" onClick={() => setPrefs({ showTranslation: !prefs.showTranslation })}>{prefs.showTranslation ? <Eye size={22} /> : <EyeOff size={22} />}</IconButton>
            <IconButton label="Translate" className="hover:bg-white/15" onClick={() => setPanel(true)}><Languages size={22} /></IconButton>
            <IconButton label="Reader settings" className="hover:bg-white/15" onClick={() => setSettings(true)}><Settings2 size={22} /></IconButton>
          </header>
          {count > 0 && (
            <footer className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center gap-2 bg-reader-bg/90 px-2 text-reader-text">
              <IconButton label="Previous chapter" className="hover:bg-white/15" disabled={!prevChapter} onClick={() => prevChapter && router.replace(`/reader?c=${prevChapter.id}`)}><SkipBack size={22} /></IconButton>
              <span className="w-8 text-center text-sm tabular-nums" aria-hidden>{index + 1}</span>
              <input type="range" aria-label="Page" min={1} max={count} value={index + 1} dir={rtl ? "rtl" : "ltr"} onChange={(e) => jump(Number(e.target.value) - 1)} className="min-w-0 flex-1 accent-[var(--reader-text)]" aria-valuetext={`Page ${index + 1} of ${count}`} />
              <span className="w-8 text-center text-sm tabular-nums" aria-hidden>{count}</span>
              <IconButton label="Next chapter" className="hover:bg-white/15" disabled={!nextChapter} onClick={() => nextChapter && router.replace(`/reader?c=${nextChapter.id}`)}><SkipForward size={22} /></IconButton>
            </footer>
          )}
        </>
      )}

      <Sheet open={settings} onClose={() => setSettings(false)} title="Reader settings">
        <Segmented label="Reading mode for this series" value={manga.readingMode} onChange={(v) => db.manga.update(manga.id, { readingMode: v })} options={[{ value: "default", label: "App default" }, { value: "rtl", label: "Right to left" }, { value: "ltr", label: "Left to right" }, { value: "vertical", label: "Vertical" }, { value: "webtoon", label: "Long strip" }]} />
        <Segmented label="Page size" value={prefs.scaleType} onChange={(v) => setPrefs({ scaleType: v })} options={[{ value: "fit-screen", label: "Fit screen" }, { value: "fit-width", label: "Fit width" }, { value: "fit-height", label: "Fit height" }, { value: "original", label: "Actual size" }]} />
        <Segmented label="Background" value={prefs.readerBackground} onChange={(v) => setPrefs({ readerBackground: v })} options={[{ value: "black", label: "Black" }, { value: "gray", label: "Grey" }, { value: "white", label: "White" }]} />
        <Switch label="Tap the sides to turn pages" description="Off: a tap anywhere shows or hides the controls." checked={prefs.tapZones} onChange={(v) => setPrefs({ tapZones: v })} />
        <Switch label="Show page number" checked={prefs.showPageNumber} onChange={(v) => setPrefs({ showPageNumber: v })} />
        <p className="px-4 pt-2 text-sm text-muted">Keyboard: arrow keys or space turn pages, M shows or hides the controls.</p>
      </Sheet>

      <TranslatePanel open={panel} onClose={() => setPanel(false)} chapterId={chapterId} pageIndex={index} pageCount={count} serverKey={serverKey} />
    </main>
  );
}
