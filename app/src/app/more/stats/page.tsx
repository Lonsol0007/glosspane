"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDuration } from "@/lib/util";

async function loadStats() {
  const [mangas, chapters, history, translations] = await Promise.all([
    db.manga.toArray(), db.chapter.toArray(), db.history.toArray(), db.translation.count(),
  ]);
  const inLibrary = new Set(mangas.filter((m) => m.favorite).map((m) => m.id));
  const mine = chapters.filter((c) => inLibrary.has(c.mangaId));
  const unreadBySeries = new Map<number, number>();
  for (const c of mine) unreadBySeries.set(c.mangaId, (unreadBySeries.get(c.mangaId) ?? 0) + (c.read ? 0 : 1));
  return {
    series: inLibrary.size,
    finished: [...unreadBySeries.values()].filter((n) => n === 0).length,
    chapters: mine.length,
    read: mine.filter((c) => c.read).length,
    pages: mine.reduce((n, c) => n + c.pageCount, 0),
    time: history.reduce((n, h) => n + h.readDurationMs, 0),
    translations,
  };
}

export default function StatsPage() {
  const s = useLiveQuery(loadStats, []);
  const tiles = s ? [
    ["Series in library", s.series],
    ["Series finished", s.finished],
    ["Chapters", s.chapters],
    ["Chapters read", s.read],
    ["Pages stored", s.pages],
    ["Pages translated", s.translations],
    ["Time reading", formatDuration(s.time)],
  ] : [];
  return (
    <main className="mx-auto min-h-dvh max-w-2xl">
      <TopBar title="Reading stats" start={<Link href="/more" aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2"><ArrowLeft size={22} /></Link>} />
      <dl className="grid grid-cols-2 gap-3 p-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface p-4">
            <dd className="text-3xl font-bold tabular-nums">{value}</dd>
            <dt className="mt-1 text-sm text-muted">{label}</dt>
          </div>
        ))}
      </dl>
    </main>
  );
}
