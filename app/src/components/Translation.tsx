"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { Languages, RefreshCw, Square, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TextBlock } from "@/lib/db";
import { LANGUAGES, setPrefs, useApiKey, usePrefs } from "@/lib/prefs";
import { deleteBlock, getTranslation, updateBlock } from "@/lib/repo";
import { retranslateBlock, runJob, stopJob, useTranslateJob } from "@/lib/translate";
import { Button, IconButton, Progress, Segmented, Select, Sheet, Switch, useToast } from "./ui";

/** Largest font size at which the text fits its box. */
function FitText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const fit = () => {
      let lo = 5;
      let hi = Math.max(lo, Math.min(96, box.clientHeight));
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        // Leave a margin for the box padding and for descenders, which sit below the measured line box.
        if (el.scrollHeight <= box.clientHeight * 0.9 && el.scrollWidth <= box.clientWidth * 0.95) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${lo}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [text]);
  return <span ref={ref} className="block max-h-full w-full break-words text-center leading-[1.15]">{text}</span>;
}

/** T02: translated text laid over the page. Sits inside a box that is exactly the image's size. */
export function TranslationOverlay({ chapterId, pageIndex }: { chapterId: number; pageIndex: number }) {
  const prefs = usePrefs();
  const translation = useLiveQuery(() => getTranslation(chapterId, pageIndex, prefs.targetLang), [chapterId, pageIndex, prefs.targetLang]);
  if (!prefs.showTranslation || !translation) return null;
  return (
    <div className="pointer-events-none absolute inset-0" data-testid="translation-overlay" lang="">
      {translation.blocks.filter((b) => b.translation.trim()).map((b) => (
        <div
          key={b.id}
          data-testid="translation-block"
          className="absolute flex items-center justify-center overflow-hidden rounded-sm font-semibold"
          style={{
            left: `${b.bbox[0] * 100}%`, top: `${b.bbox[1] * 100}%`, width: `${b.bbox[2] * 100}%`, height: `${b.bbox[3] * 100}%`,
            background: prefs.cleanBubbles ? b.bg : `color-mix(in srgb, ${b.bg} 70%, transparent)`,
            color: b.fg, padding: "1.5%",
            fontFamily: prefs.translationFont === "comic" ? "var(--font-comic)" : "inherit",
          }}
        >
          <FitText text={b.translation} />
        </div>
      ))}
    </div>
  );
}

/** T01 + T03: run translation and proofread the current page. */
export function TranslatePanel({ open, onClose, chapterId, pageIndex, pageCount, serverKey }: { open: boolean; onClose: () => void; chapterId: number; pageIndex: number; pageCount: number; serverKey: boolean }) {
  const prefs = usePrefs();
  const apiKey = useApiKey();
  const job = useTranslateJob();
  const [scope, setScope] = useState<"page" | "chapter">("page");
  const translation = useLiveQuery(() => getTranslation(chapterId, pageIndex, prefs.targetLang), [chapterId, pageIndex, prefs.targetLang]);
  const canRun = !!apiKey || serverKey;

  const run = () => {
    setPrefs({ showTranslation: true });
    if (scope === "page") runJob(chapterId, [pageIndex], { skipDone: false });
    else runJob(chapterId, Array.from({ length: pageCount }, (_, i) => i), { skipDone: true });
  };

  return (
    <Sheet open={open} onClose={onClose} title="Translate">
      {!canRun && (
        <div className="mx-4 mb-2 rounded-md bg-accent-soft p-4 text-sm text-on-accent-soft">
          <p className="font-semibold">Add an API key to translate</p>
          <p className="mt-1">Translation runs on your own Anthropic API key. It is kept in this browser only.</p>
          <Link href="/settings#translation" className="mt-2 inline-block font-semibold underline">Open translation settings</Link>
        </div>
      )}
      <Select className="px-4 py-2" label="Translate into" value={prefs.targetLang} onChange={(v) => setPrefs({ targetLang: v })} options={LANGUAGES} />
      <Segmented label="What to translate" value={scope} onChange={setScope} options={[{ value: "page", label: `This page (${pageIndex + 1})` }, { value: "chapter", label: "Rest of the chapter" }]} />
      <div className="flex items-center gap-2 px-4 py-2">
        {job.running ? (
          <Button variant="tonal" onClick={stopJob}><Square size={16} aria-hidden />Stop</Button>
        ) : (
          <Button onClick={run} disabled={!canRun}><Languages size={18} aria-hidden />{translation && scope === "page" ? "Translate again" : "Translate"}</Button>
        )}
        {scope === "chapter" && !job.running && <span className="text-sm text-muted">Pages already done are skipped.</span>}
      </div>
      {job.running && (
        <div className="px-4 py-2">
          <p className="mb-2 text-sm text-muted" role="status">{job.total > 1 ? `Page ${Math.min(job.done + 1, job.total)} of ${job.total}…` : "Reading and translating the page…"}</p>
          <Progress value={job.total > 1 ? job.done / job.total : null} label="Translation progress" />
        </div>
      )}
      {!job.running && job.error && job.chapterId === chapterId && (
        <p role="alert" className="mx-4 my-2 rounded-md border border-danger p-3 text-sm text-danger">{job.error}{job.total > 1 ? ` ${job.total - job.done} ${job.total - job.done === 1 ? "page was" : "pages were"} not attempted.` : ""}</p>
      )}
      <Switch label="Show translation" description="Turn off to see the original page." checked={prefs.showTranslation} onChange={(v) => setPrefs({ showTranslation: v })} />

      <h3 className="px-4 pb-1 pt-4 text-sm font-semibold text-accent">Proofread page {pageIndex + 1}</h3>
      {!translation ? (
        <p className="px-4 text-sm text-muted">This page has not been translated into {prefs.targetLang} yet.</p>
      ) : translation.blocks.length === 0 ? (
        <p className="px-4 text-sm text-muted">No text was found on this page.</p>
      ) : (
        <ol className="flex flex-col gap-3 px-4">
          {translation.blocks.map((b, i) => <BlockEditor key={b.id} n={i + 1} block={b} translationId={translation.id} canRun={canRun} />)}
        </ol>
      )}
    </Sheet>
  );
}

function BlockEditor({ n, block, translationId, canRun }: { n: number; block: TextBlock; translationId: number; canRun: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState(block.source);
  const [translation, setTranslation] = useState(block.translation);
  useEffect(() => setTranslation(block.translation), [block.translation]);
  const edited = block.sourceEdited || block.translationEdited;

  const retranslate = async () => {
    setBusy(true);
    try {
      await retranslateBlock(translationId, { ...block, source });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Translation failed.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-md bg-bg p-3" data-testid="block-editor">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Text {n}{edited && <span className="ml-2 font-normal text-muted">edited</span>}</span>
        <span className="flex">
          <IconButton label={`Translate text ${n} again`} disabled={busy || !canRun} onClick={retranslate}><RefreshCw size={18} className={busy ? "animate-spin" : ""} /></IconButton>
          <IconButton label={`Delete text ${n}`} onClick={() => deleteBlock(translationId, block.id)}><Trash2 size={18} /></IconButton>
        </span>
      </div>
      <label className="block text-xs text-muted">Original{block.sourceLang ? ` (${block.sourceLang})` : ""}
        <textarea rows={2} value={source} onChange={(e) => setSource(e.target.value)} onBlur={() => source !== block.source && updateBlock(translationId, block.id, { source, sourceEdited: true })} className="mt-1 w-full rounded-sm border border-border-input bg-bg p-2 text-sm text-text" />
      </label>
      <label className="mt-2 block text-xs text-muted">Translation
        <textarea rows={2} value={translation} onChange={(e) => { setTranslation(e.target.value); updateBlock(translationId, block.id, { translation: e.target.value, translationEdited: true }); }} className="mt-1 w-full rounded-sm border border-border-input bg-bg p-2 text-sm text-text" />
      </label>
    </li>
  );
}
