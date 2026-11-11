"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Cover } from "@/components/Cover";
import { EmptyState, TopBar } from "@/components/ui";
import { db } from "@/lib/db";
import { dayKey, dayLabel } from "@/lib/util";

async function loadUpdates() {
  const chapters = await db.chapter.orderBy("dateFetch").reverse().limit(300).toArray();
  const mangas = await db.manga.bulkGet(chapters.map((c) => c.mangaId));
  return chapters.flatMap((chapter, i) => (mangas[i]?.favorite ? [{ chapter, manga: mangas[i]! }] : []));
}

export default function UpdatesPage() {
  const rows = useLiveQuery(loadUpdates, []);
  return (
    <>
      <TopBar title="New" />
      {rows === undefined ? null : rows.length === 0 ? (
        <EmptyState icon={<Sparkles size={56} />} title="Nothing new" body="Chapters you add appear here, newest first." />
      ) : (
        <ul>
          {rows.map((r, i) => (
            <li key={r.chapter.id}>
              {(i === 0 || dayKey(rows[i - 1].chapter.dateFetch) !== dayKey(r.chapter.dateFetch)) && <h2 className="px-4 pb-1 pt-4 text-sm font-semibold text-muted">{dayLabel(r.chapter.dateFetch)}</h2>}
              <Link href={`/reader?c=${r.chapter.id}`} className="flex items-center gap-4 px-4 py-2 hover:bg-surface">
                <Cover blob={r.manga.cover} title={r.manga.title} className="w-12 shrink-0" />
                <span className="min-w-0">
                  <span className={`block truncate ${r.chapter.read ? "text-muted" : "font-medium"}`}>{r.manga.title}</span>
                  <span className="block truncate text-sm text-muted">{r.chapter.name}{r.chapter.read ? " · read" : ""}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
