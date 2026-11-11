"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Bookmark, EllipsisVertical, Heart, ListFilter, Pencil, Play, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Cover } from "@/components/Cover";
import { Button, Chip, Dialog, EmptyState, IconButton, Menu, MenuItem, Select, Sheet, Switch, TextField, TopBar, useToast } from "@/components/ui";
import { db, type Chapter, type Manga, type MangaStatus } from "@/lib/db";
import { setPrefs, usePrefs } from "@/lib/prefs";
import { deleteChapters, deleteManga, getChapters, markPreviousRead, nextUnread, setChaptersRead } from "@/lib/repo";

const statusLabels: Record<MangaStatus, string> = { unknown: "Status not set", ongoing: "Ongoing", completed: "Completed", hiatus: "On hiatus", cancelled: "Cancelled" };

// The id is a query parameter, not a path segment, so the app can be exported as static files.
export default function MangaPage() {
  return <Suspense><MangaView /></Suspense>;
}

function MangaView() {
  const id = Number(useSearchParams().get("id") ?? NaN);
  const router = useRouter();
  const toast = useToast();
  const prefs = usePrefs();
  const data = useLiveQuery(async () => {
    const manga = Number.isInteger(id) ? await db.manga.get(id) : undefined;
    return { manga: manga ?? null, chapters: manga ? await getChapters(id) : [] };
  }, [id]);
  const [expanded, setExpanded] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!data) return null;
  const { manga, chapters } = data;
  if (!manga) {
    return <EmptyState icon={<SearchX size={56} />} title="Series not found" body="It may have been deleted from this device." action={<Link href="/" className="font-semibold text-accent">Back to library</Link>} />;
  }

  const resume = nextUnread(chapters);
  const started = chapters.some((c) => c.read || c.lastPageRead > 0);
  let shown = chapters.filter((c) => (!prefs.chapterFilterUnread || !c.read) && (!prefs.chapterFilterBookmarked || c.bookmark));
  if (prefs.chapterSortDesc) shown = [...shown].reverse();
  const filtersOn = prefs.chapterFilterUnread || prefs.chapterFilterBookmarked;

  return (
    <main className="mx-auto min-h-dvh max-w-3xl pb-24">
      <TopBar title="" start={<Link href="/" aria-label="Back to library" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2"><ArrowLeft size={22} /></Link>}>
        <IconButton label="Filter and sort chapters" active={filtersOn} onClick={() => setSheet(true)}><ListFilter size={22} /></IconButton>
        <Menu label="More actions" button={<EllipsisVertical size={22} />}>
          {(close) => <>
            <MenuItem onClick={() => { close(); setEditing(true); }}>Edit details</MenuItem>
            <MenuItem onClick={async () => { close(); await setChaptersRead(chapters.map((c) => c.id), true); }}>Mark all as read</MenuItem>
            <MenuItem onClick={async () => { close(); await setChaptersRead(chapters.map((c) => c.id), false); }}>Mark all as unread</MenuItem>
            <MenuItem danger onClick={() => { close(); setConfirmDelete(true); }}>Delete series</MenuItem>
          </>}
        </Menu>
      </TopBar>

      <div className="flex gap-4 px-4">
        <Cover blob={manga.cover} title={manga.title} className="w-28 shrink-0 self-start shadow-card" />
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-xl font-semibold">{manga.title}</h1>
          {manga.author && <p className="mt-1 text-sm text-muted">{manga.author}{manga.artist && manga.artist !== manga.author ? `, ${manga.artist}` : ""}</p>}
          <p className="mt-1 text-sm text-muted">{statusLabels[manga.status]} · On this device</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant={manga.favorite ? "tonal" : "filled"} aria-pressed={manga.favorite} onClick={() => db.manga.update(manga.id, { favorite: !manga.favorite })}>
              <Heart size={18} fill={manga.favorite ? "currentColor" : "none"} aria-hidden />
              {manga.favorite ? "In library" : "Add to library"}
            </Button>
            <IconButton label="Edit details" onClick={() => setEditing(true)}><Pencil size={20} /></IconButton>
          </div>
        </div>
      </div>

      {(manga.description || manga.genre.length > 0 || manga.notes) && (
        <div className="px-4 pt-4">
          {manga.description && (
            <>
              <p className={`whitespace-pre-line text-sm text-muted ${expanded ? "" : "line-clamp-3"}`}>{manga.description}</p>
              {manga.description.length > 160 && <button type="button" className="mt-1 text-sm font-semibold text-accent" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : "Show more"}</button>}
            </>
          )}
          {manga.genre.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{manga.genre.map((g) => <Chip key={g}>{g}</Chip>)}</div>}
          {manga.notes && <p className="mt-3 whitespace-pre-line rounded-md bg-surface p-3 text-sm"><span className="font-semibold">Your notes: </span>{manga.notes}</p>}
        </div>
      )}

      <h2 className="px-4 pb-2 pt-6 font-semibold">{chapters.length} {chapters.length === 1 ? "chapter" : "chapters"}</h2>
      {chapters.length === 0 ? (
        <p className="px-4 text-sm text-muted">This series has no chapters. Add files for it from the Add tab, using the same title.</p>
      ) : shown.length === 0 ? (
        <p className="px-4 text-sm text-muted">No chapters match the filters. <button type="button" className="font-semibold text-accent" onClick={() => setPrefs({ chapterFilterUnread: false, chapterFilterBookmarked: false })}>Clear filters</button></p>
      ) : (
        <ul>
          {shown.map((c) => <ChapterRow key={c.id} chapter={c} />)}
        </ul>
      )}

      {resume && (
        <Link href={`/reader?c=${resume.id}`} className="fixed bottom-6 right-6 z-30 inline-flex h-14 items-center gap-2 rounded-lg bg-accent px-5 font-semibold text-on-accent shadow-pop">
          <Play size={20} fill="currentColor" aria-hidden />
          {started ? "Resume" : "Start"}
        </Link>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Chapters">
        <Switch label="Unread only" checked={prefs.chapterFilterUnread} onChange={(v) => setPrefs({ chapterFilterUnread: v })} />
        <Switch label="Bookmarked only" checked={prefs.chapterFilterBookmarked} onChange={(v) => setPrefs({ chapterFilterBookmarked: v })} />
        <Switch label="Newest first" checked={prefs.chapterSortDesc} onChange={(v) => setPrefs({ chapterSortDesc: v })} />
      </Sheet>

      {editing && <EditDialog manga={manga} onClose={() => setEditing(false)} />}

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this series?"
        actions={<>
          <Button variant="text" onClick={() => setConfirmDelete(false)}>Keep</Button>
          <Button variant="danger" onClick={async () => { await deleteManga([manga.id]); toast("Deleted from this device."); router.replace("/"); }}>Delete</Button>
        </>}
      >
        <p className="text-sm text-muted">Its pages, progress and translations are removed from this device. Your original files are not touched.</p>
      </Dialog>
    </main>
  );
}

function ChapterRow({ chapter: c }: { chapter: Chapter }) {
  const missing = c.pageCount === 0;
  const detail = missing
    ? "Pages missing. Add the file again to attach them."
    : c.read ? `${c.pageCount} pages · read`
    : c.lastPageRead > 0 ? `Page ${c.lastPageRead + 1} of ${c.pageCount}`
    : `${c.pageCount} pages`;
  const body = (
    <>
      <span className={`flex items-center gap-2 truncate ${c.read ? "text-muted" : "font-medium"}`}>
        {c.bookmark && <Bookmark size={16} className="shrink-0 text-accent" fill="currentColor" aria-label="Bookmarked" />}
        <span className="truncate">{c.name}</span>
      </span>
      <span className="block truncate text-sm text-muted">{detail}</span>
    </>
  );
  return (
    <li className="flex items-center gap-1 pl-4 pr-2 hover:bg-surface">
      {missing ? <div className="min-w-0 flex-1 py-3">{body}</div> : <Link href={`/reader?c=${c.id}`} className="min-w-0 flex-1 py-3">{body}</Link>}
      <Menu label={`Actions for ${c.name}`} button={<EllipsisVertical size={20} />}>
        {(close) => <>
          <MenuItem onClick={() => { close(); setChaptersRead([c.id], !c.read); }}>{c.read ? "Mark as unread" : "Mark as read"}</MenuItem>
          <MenuItem onClick={() => { close(); db.chapter.update(c.id, { bookmark: !c.bookmark }); }}>{c.bookmark ? "Remove bookmark" : "Bookmark"}</MenuItem>
          <MenuItem onClick={() => { close(); markPreviousRead(c); }}>Mark earlier chapters as read</MenuItem>
          <MenuItem danger onClick={() => { close(); deleteChapters([c.id]); }}>Delete chapter</MenuItem>
        </>}
      </Menu>
    </li>
  );
}

function EditDialog({ manga, onClose }: { manga: Manga; onClose: () => void }) {
  const [form, setForm] = useState({ title: manga.title, author: manga.author, artist: manga.artist, description: manga.description, genre: manga.genre.join(", "), status: manga.status, notes: manga.notes });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const save = async () => {
    if (!form.title.trim()) return;
    // The import key follows the title, so adding files under the new title lands in this series.
    const key = form.title.trim().toLowerCase();
    const clash = await db.manga.where("[source+url]").equals([manga.source, key]).first();
    await db.manga.update(manga.id, {
      url: clash && clash.id !== manga.id ? manga.url : key,
      title: form.title.trim(), author: form.author.trim(), artist: form.artist.trim(), description: form.description.trim(),
      genre: form.genre.split(",").map((g) => g.trim()).filter(Boolean), status: form.status, notes: form.notes.trim(),
    });
    onClose();
  };
  return (
    <Dialog open onClose={onClose} title="Edit details" actions={<><Button variant="text" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!form.title.trim()}>Save</Button></>}>
      <div className="flex flex-col gap-3">
        <TextField label="Title" value={form.title} maxLength={200} onChange={(e) => set({ title: e.target.value })} error={form.title.trim() ? null : "A series needs a title."} />
        <TextField label="Author" value={form.author} maxLength={120} onChange={(e) => set({ author: e.target.value })} />
        <TextField label="Artist" value={form.artist} maxLength={120} onChange={(e) => set({ artist: e.target.value })} />
        <TextField label="Genres, separated by commas" value={form.genre} maxLength={300} onChange={(e) => set({ genre: e.target.value })} />
        <Select label="Status" value={form.status} onChange={(v) => set({ status: v as MangaStatus })} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} />
        <label className="block text-sm text-muted">Description
          <textarea value={form.description} maxLength={4000} rows={4} onChange={(e) => set({ description: e.target.value })} className="mt-1 w-full rounded-md border border-border-input bg-bg p-3 text-base text-text" />
        </label>
        <label className="block text-sm text-muted">Your notes
          <textarea value={form.notes} maxLength={4000} rows={3} onChange={(e) => set({ notes: e.target.value })} className="mt-1 w-full rounded-md border border-border-input bg-bg p-3 text-base text-text" />
        </label>
      </div>
    </Dialog>
  );
}
