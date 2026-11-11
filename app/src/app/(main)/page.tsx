"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, CheckCheck, FolderPlus, LibraryBig, ListFilter, Search, SquareCheck, Trash2, Undo2, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Cover } from "@/components/Cover";
import { Button, Dialog, EmptyState, IconButton, Segmented, Sheet, Switch, TopBar, useToast } from "@/components/ui";
import { db } from "@/lib/db";
import { setPrefs, usePrefs } from "@/lib/prefs";
import { deleteManga, getLibrary, setMangaCategories, setMangaRead, type LibraryItem } from "@/lib/repo";
import { naturalCompare } from "@/lib/util";

const DEFAULT_TAB = -1;

export default function LibraryPage() {
  const prefs = usePrefs();
  const toast = useToast();
  const items = useLiveQuery(getLibrary, []);
  const categories = useLiveQuery(() => db.category.orderBy("sort").toArray(), []);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<Set<number> | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<Set<number> | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    const list = items.filter((it) => {
      if (q && !it.manga.title.toLowerCase().includes(q) && !it.manga.author.toLowerCase().includes(q)) return false;
      if (prefs.filterUnread && it.unread === 0) return false;
      if (prefs.filterStarted && !it.started) return false;
      if (prefs.filterCompleted && it.unread > 0) return false;
      if (prefs.filterBookmarked && !it.bookmarked) return false;
      return true;
    });
    const by: Record<typeof prefs.librarySort, (a: LibraryItem, b: LibraryItem) => number> = {
      title: (a, b) => naturalCompare(a.manga.title, b.manga.title),
      lastRead: (a, b) => a.lastRead - b.lastRead,
      dateAdded: (a, b) => a.manga.dateAdded - b.manga.dateAdded,
      unread: (a, b) => a.unread - b.unread,
    };
    list.sort((a, b) => by[prefs.librarySort](a, b) || naturalCompare(a.manga.title, b.manga.title));
    if (prefs.librarySortDesc) list.reverse();
    return list;
  }, [items, query, prefs]);

  const hasUncategorised = filtered.some((it) => it.categoryIds.length === 0);
  const tabs = useMemo(() => {
    if (!categories?.length) return [];
    return [...(hasUncategorised ? [{ id: DEFAULT_TAB, name: "Default" }] : []), ...categories];
  }, [categories, hasUncategorised]);
  const activeTab = tabs.length ? (tabs.find((t) => t.id === tab)?.id ?? tabs[0].id) : null;
  const visible = activeTab === null || query.trim()
    ? filtered
    : filtered.filter((it) => (activeTab === DEFAULT_TAB ? it.categoryIds.length === 0 : it.categoryIds.includes(activeTab)));

  const filtersOn = prefs.filterUnread || prefs.filterStarted || prefs.filterCompleted || prefs.filterBookmarked;
  const toggle = (id: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const ids = selected ? [...selected] : [];

  return (
    <>
      {selected ? (
        <TopBar title={`${selected.size} selected`} start={<IconButton label="Stop selecting" onClick={() => setSelected(null)}><X size={22} /></IconButton>}>
          <IconButton label="Select all" onClick={() => setSelected(new Set(visible.map((v) => v.manga.id)))}><SquareCheck size={22} /></IconButton>
        </TopBar>
      ) : searching ? (
        <TopBar title="" start={<IconButton label="Close search" onClick={() => { setSearching(false); setQuery(""); }}><X size={22} /></IconButton>}>
          <input autoFocus type="search" aria-label="Search your library" placeholder="Title or author" value={query} onChange={(e) => setQuery(e.target.value)} className="absolute inset-y-2 left-14 right-2 rounded-full bg-surface px-4 text-base" />
        </TopBar>
      ) : (
        <TopBar title="Library">
          <IconButton label="Search" onClick={() => setSearching(true)}><Search size={22} /></IconButton>
          <IconButton label="Filter, sort and display" active={filtersOn} onClick={() => setSheet(true)}><ListFilter size={22} /></IconButton>
          <IconButton label="Select series" disabled={!visible.length} onClick={() => setSelected(new Set())}><CheckCheck size={22} /></IconButton>
        </TopBar>
      )}

      {tabs.length > 0 && !query.trim() && (
        <div role="tablist" aria-label="Categories" className="flex overflow-x-auto border-b border-border px-2">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={t.id === activeTab} onClick={() => setTab(t.id)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${t.id === activeTab ? "border-accent text-accent" : "border-transparent text-muted"}`}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {items === undefined ? (
        <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-6" aria-busy="true" aria-label="Loading your library">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-surface-2" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<LibraryBig size={56} />} title="Nothing on the shelf yet" body="Add a .cbz or .zip file, or a set of page images, and it will show up here." action={<Link href="/browse" className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent">Add your first series</Link>} />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Search size={56} />} title="No matches" body={query.trim() ? `Nothing in your library matches “${query.trim()}”.` : "No series match the filters that are switched on."} action={filtersOn && !query.trim() ? <Button variant="tonal" onClick={() => setPrefs({ filterUnread: false, filterStarted: false, filterCompleted: false, filterBookmarked: false })}>Clear filters</Button> : undefined} />
      ) : prefs.libraryDisplay === "list" ? (
        <ul className="py-2">
          {visible.map((it) => (
            <li key={it.manga.id}>
              <Entry item={it} selected={selected} toggle={toggle} className="flex items-center gap-4 px-4 py-2 hover:bg-surface">
                <Cover blob={it.manga.cover} title={it.manga.title} className="w-10 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{it.manga.title}</span>
                {it.unread > 0 && <Badge n={it.unread} />}
              </Entry>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-6">
          {visible.map((it) => (
            <li key={it.manga.id}>
              <Entry item={it} selected={selected} toggle={toggle} className="relative block">
                <Cover blob={it.manga.cover} title={it.manga.title} />
                {it.unread > 0 && <span className="absolute left-1 top-1"><Badge n={it.unread} /></span>}
                {prefs.libraryDisplay === "compact" ? (
                  <span className="absolute inset-x-0 bottom-0 line-clamp-2 rounded-b-md bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6 text-xs font-semibold text-white">{it.manga.title}</span>
                ) : (
                  <span className="mt-1 line-clamp-2 block text-sm font-medium">{it.manga.title}</span>
                )}
              </Entry>
            </li>
          ))}
        </ul>
      )}

      {selected && selected.size > 0 && (
        <div role="toolbar" aria-label="Actions for selected series" className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-md justify-around rounded-lg bg-surface-2 p-2 shadow-pop md:bottom-6">
          <IconButton label="Set categories" onClick={() => setCategoryDialog(new Set(items?.filter((i) => selected.has(i.manga.id)).flatMap((i) => i.categoryIds)))}><FolderPlus size={22} /></IconButton>
          <IconButton label="Mark as read" onClick={async () => { await setMangaRead(ids, true); setSelected(null); }}><Check size={22} /></IconButton>
          <IconButton label="Mark as unread" onClick={async () => { await setMangaRead(ids, false); setSelected(null); }}><Undo2 size={22} /></IconButton>
          <IconButton label="Delete" onClick={() => setConfirmRemove(true)}><Trash2 size={22} /></IconButton>
        </div>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Library view">
        <h3 className="px-4 pt-2 text-sm font-semibold text-accent">Show only</h3>
        <Switch label="Unread" checked={prefs.filterUnread} onChange={(v) => setPrefs({ filterUnread: v })} />
        <Switch label="Started" checked={prefs.filterStarted} onChange={(v) => setPrefs({ filterStarted: v })} />
        <Switch label="Finished" checked={prefs.filterCompleted} onChange={(v) => setPrefs({ filterCompleted: v })} />
        <Switch label="With bookmarks" checked={prefs.filterBookmarked} onChange={(v) => setPrefs({ filterBookmarked: v })} />
        <Segmented label="Sort by" value={prefs.librarySort} onChange={(v) => setPrefs({ librarySort: v })} options={[{ value: "title", label: "Title" }, { value: "lastRead", label: "Last read" }, { value: "dateAdded", label: "Date added" }, { value: "unread", label: "Unread count" }]} />
        <Switch label="Reverse order" checked={prefs.librarySortDesc} onChange={(v) => setPrefs({ librarySortDesc: v })} />
        <Segmented label="Layout" value={prefs.libraryDisplay} onChange={(v) => setPrefs({ libraryDisplay: v })} options={[{ value: "comfortable", label: "Grid" }, { value: "compact", label: "Compact grid" }, { value: "list", label: "List" }]} />
      </Sheet>

      <Dialog
        open={!!categoryDialog}
        onClose={() => setCategoryDialog(null)}
        title="Set categories"
        actions={<>
          <Button variant="text" onClick={() => setCategoryDialog(null)}>Cancel</Button>
          <Button onClick={async () => { await setMangaCategories(ids, [...categoryDialog!]); setCategoryDialog(null); setSelected(null); }}>Save</Button>
        </>}
      >
        {categories?.length ? categories.map((c) => (
          <label key={c.id} className="flex items-center gap-3 py-2">
            <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={categoryDialog?.has(c.id) ?? false} onChange={(e) => setCategoryDialog((s) => { const n = new Set(s); if (e.target.checked) n.add(c.id); else n.delete(c.id); return n; })} />
            {c.name}
          </label>
        )) : <p className="text-sm text-muted">You have no categories yet. Make one under More, then Categories.</p>}
      </Dialog>

      <Dialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={`Delete ${ids.length} series?`}
        actions={<>
          <Button variant="text" onClick={() => setConfirmRemove(false)}>Keep</Button>
          <Button variant="danger" onClick={async () => { await deleteManga(ids); setConfirmRemove(false); setSelected(null); toast("Deleted from this device."); }}>Delete</Button>
        </>}
      >
        <p className="text-sm text-muted">Their pages, progress and translations are removed from this device. Your original files are not touched.</p>
      </Dialog>
    </>
  );
}

function Badge({ n }: { n: number }) {
  return <span className="rounded-sm bg-accent px-1.5 py-0.5 text-xs font-semibold text-on-accent" aria-label={`${n} unread`}>{n}</span>;
}

function Entry({ item, selected, toggle, className, children }: { item: LibraryItem; selected: Set<number> | null; toggle: (id: number) => void; className: string; children: React.ReactNode }) {
  if (!selected) return <Link href={`/manga?id=${item.manga.id}`} className={className}>{children}</Link>;
  const on = selected.has(item.manga.id);
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={item.manga.title} onClick={() => toggle(item.manga.id)} className={`${className} w-full rounded-md text-left ${on ? "outline outline-4 outline-accent" : ""}`}>
      {children}
    </button>
  );
}
