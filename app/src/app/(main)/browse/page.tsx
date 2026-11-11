"use client";
import { FileArchive, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Dialog, Progress, TextField, TopBar, useToast } from "@/components/ui";
import { makeCover, readFiles, type ReadResult } from "@/lib/import";
import { commitImport } from "@/lib/repo";

export default function BrowsePage() {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<ReadResult | null>(null);
  const [title, setTitle] = useState("");
  const [problems, setProblems] = useState<ReadResult["skipped"]>([]);
  const [dragging, setDragging] = useState(false);

  async function pick(files: File[]) {
    if (!files.length) return;
    setProblems([]);
    setBusy("Opening your files…");
    try {
      const result = await readFiles(files);
      setProblems(result.skipped);
      if (result.chapters.length === 0) return;
      setTitle(result.suggestedTitle);
      setPending(result);
    } catch {
      toast("Those files could not be read. Try again with a .cbz or .zip.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!pending) return;
    const chapters = pending.chapters;
    setPending(null);
    setBusy("Saving pages to this device…");
    try {
      await navigator.storage?.persist?.();
      const cover = await makeCover(chapters[0]?.pages[0]);
      const result = await commitImport(title, chapters, cover);
      if (result.added === 0) toast("Already in your library. Nothing new was added.");
      else toast(`Added ${result.added} ${result.added === 1 ? "chapter" : "chapters"}${result.duplicates ? `, skipped ${result.duplicates} you already had` : ""}.`);
      router.push(`/manga?id=${result.mangaId}`);
    } catch (e) {
      const full = e instanceof Error && /quota/i.test(e.name + e.message);
      toast(full ? "This device is out of storage for the app. Free some space and try again." : "Saving failed. Nothing was added.", "error");
    } finally {
      setBusy(null);
    }
  }

  const pageCount = pending?.chapters.reduce((n, c) => n + c.pages.length, 0) ?? 0;

  return (
    <>
      <TopBar title="Add" />
      <div className="p-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick([...e.dataTransfer.files]); }}
          className={`flex flex-col items-center gap-4 rounded-lg border-2 border-dashed px-6 py-16 text-center ${dragging ? "border-accent bg-accent-soft" : "border-border-input"}`}
        >
          <FileArchive size={48} className="text-muted" aria-hidden />
          <div>
            <p className="text-xl font-semibold">Add from this device</p>
            <p className="mt-1 max-w-md text-sm text-muted">Pick .cbz or .zip files (one per chapter), or a set of page images. Drop them here if you are on a computer. Files stay on this device.</p>
          </div>
          <Button onClick={() => input.current?.click()} loading={!!busy}><FolderOpen size={18} aria-hidden />Choose files</Button>
          <input ref={input} data-testid="file-input" type="file" multiple accept=".cbz,.zip,image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { pick([...(e.target.files ?? [])]); e.target.value = ""; }} />
          {busy && <div className="w-full max-w-xs"><p className="mb-2 text-sm text-muted" role="status">{busy}</p><Progress value={null} label={busy} /></div>}
        </div>

        {problems.length > 0 && (
          <div role="alert" className="mt-4 rounded-md border border-danger p-4 text-sm">
            <p className="font-semibold text-danger">{problems.length === 1 ? "One file was left out" : `${problems.length} files were left out`}</p>
            <ul className="mt-1 list-disc pl-5 text-muted">
              {problems.map((p) => <li key={p.name}><span className="break-all">{p.name}</span>: {p.reason}</li>)}
            </ul>
          </div>
        )}
      </div>

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title="Add to library"
        actions={<>
          <Button variant="text" onClick={() => setPending(null)}>Cancel</Button>
          <Button onClick={save} disabled={!title.trim()}>Add</Button>
        </>}
      >
        <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) save(); }}>
          <TextField label="Series title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} error={title.trim() ? null : "A series needs a title."} />
        </form>
        <p className="mt-3 text-sm text-muted">
          {pending?.chapters.length} {pending?.chapters.length === 1 ? "chapter" : "chapters"}, {pageCount} pages. Use the title of a series you already have to add these chapters to it.
        </p>
      </Dialog>
    </>
  );
}
