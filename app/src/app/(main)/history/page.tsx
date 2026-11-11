"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { Clock, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Cover } from "@/components/Cover";
import { Button, Dialog, EmptyState, IconButton, TopBar } from "@/components/ui";
import { db } from "@/lib/db";
import { dayKey, dayLabel } from "@/lib/util";

async function loadHistory() {
  const rows = await db.history.orderBy("readAt").reverse().toArray();
  const [mangas, chapters] = await Promise.all([
    db.manga.bulkGet(rows.map((r) => r.mangaId)),
    db.chapter.bulkGet(rows.map((r) => r.chapterId)),
  ]);
  return rows.flatMap((h, i) => (mangas[i] && chapters[i] ? [{ h, manga: mangas[i]!, chapter: chapters[i]! }] : []));
}

export default function HistoryPage() {
  const rows = useLiveQuery(loadHistory, []);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const q = query.trim().toLowerCase();
  const shown = rows?.filter((r) => !q || r.manga.title.toLowerCase().includes(q)) ?? [];

  return (
    <>
      {searching ? (
        <TopBar title="" start={<IconButton label="Close search" onClick={() => { setSearching(false); setQuery(""); }}><X size={22} /></IconButton>}>
          <input autoFocus type="search" aria-label="Search history" placeholder="Series title" value={query} onChange={(e) => setQuery(e.target.value)} className="absolute inset-y-2 left-14 right-2 rounded-full bg-surface px-4 text-base" />
        </TopBar>
      ) : (
        <TopBar title="History">
          <IconButton label="Search" onClick={() => setSearching(true)}><Search size={22} /></IconButton>
          <IconButton label="Clear all history" disabled={!rows?.length} onClick={() => setConfirm(true)}><Trash2 size={22} /></IconButton>
        </TopBar>
      )}

      {rows === undefined ? null : rows.length === 0 ? (
        <EmptyState icon={<Clock size={56} />} title="No reading history" body="Chapters you open will be listed here so you can pick up where you stopped." />
      ) : shown.length === 0 ? (
        <EmptyState icon={<Search size={56} />} title="No matches" body={`Nothing in your history matches “${query.trim()}”.`} />
      ) : (
        <ul>
          {shown.map((r, i) => (
            <li key={r.h.id}>
              {(i === 0 || dayKey(shown[i - 1].h.readAt) !== dayKey(r.h.readAt)) && <h2 className="px-4 pb-1 pt-4 text-sm font-semibold text-muted">{dayLabel(r.h.readAt)}</h2>}
              <div className="flex items-center gap-2 px-4 py-2 hover:bg-surface">
                <Link href={`/reader?c=${r.chapter.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <Cover blob={r.manga.cover} title={r.manga.title} className="w-12 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.manga.title}</span>
                    <span className="block truncate text-sm text-muted">
                      {r.chapter.name} · {new Date(r.h.readAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </span>
                </Link>
                <IconButton label={`Remove ${r.chapter.name} from history`} onClick={() => db.history.delete(r.h.id)}><Trash2 size={20} /></IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Clear all history?"
        actions={<>
          <Button variant="text" onClick={() => setConfirm(false)}>Keep</Button>
          <Button variant="danger" onClick={async () => { await db.history.clear(); setConfirm(false); }}>Clear</Button>
        </>}
      >
        <p className="text-sm text-muted">The list is emptied. Read marks and page progress on chapters stay as they are.</p>
      </Dialog>
    </>
  );
}
