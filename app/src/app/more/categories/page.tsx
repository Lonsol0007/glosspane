"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowLeft, ArrowUp, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, Dialog, EmptyState, IconButton, TextField, TopBar } from "@/components/ui";
import { db, type Category } from "@/lib/db";
import { addCategory, deleteCategory, moveCategory, renameCategory } from "@/lib/repo";

export default function CategoriesPage() {
  const categories = useLiveQuery(() => db.category.orderBy("sort").toArray(), []);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Category | null>(null);

  const open = (target: Category | "new") => {
    setEditing(target);
    setName(target === "new" ? "" : target.name);
    setError(null);
  };
  const save = async () => {
    const problem = editing === "new" ? await addCategory(name) : await renameCategory((editing as Category).id, name);
    if (problem) setError(problem);
    else setEditing(null);
  };

  return (
    <main className="mx-auto min-h-dvh max-w-2xl">
      <TopBar title="Categories" start={<Link href="/more" aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2"><ArrowLeft size={22} /></Link>}>
        <IconButton label="New category" onClick={() => open("new")}><Plus size={22} /></IconButton>
      </TopBar>
      {categories === undefined ? null : categories.length === 0 ? (
        <EmptyState icon={<FolderTree size={56} />} title="No categories" body="Categories become tabs in your library. Make one, then assign series to it from the library." action={<Button onClick={() => open("new")}>New category</Button>} />
      ) : (
        <ul className="p-2">
          {categories.map((c, i) => (
            <li key={c.id} className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-surface">
              <span className="min-w-0 flex-1 truncate px-2">{c.name}</span>
              <IconButton label={`Move ${c.name} up`} disabled={i === 0} onClick={() => moveCategory(c.id, -1)}><ArrowUp size={20} /></IconButton>
              <IconButton label={`Move ${c.name} down`} disabled={i === categories.length - 1} onClick={() => moveCategory(c.id, 1)}><ArrowDown size={20} /></IconButton>
              <IconButton label={`Rename ${c.name}`} onClick={() => open(c)}><Pencil size={20} /></IconButton>
              <IconButton label={`Delete ${c.name}`} onClick={() => setRemoving(c)}><Trash2 size={20} /></IconButton>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New category" : "Rename category"}
        actions={<>
          <Button variant="text" onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </>}
      >
        <form onSubmit={(e) => { e.preventDefault(); save(); }}>
          <TextField label="Name" autoFocus value={name} maxLength={60} onChange={(e) => { setName(e.target.value); setError(null); }} error={error} />
        </form>
      </Dialog>

      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Delete “${removing?.name}”?`}
        actions={<>
          <Button variant="text" onClick={() => setRemoving(null)}>Keep</Button>
          <Button variant="danger" onClick={async () => { await deleteCategory(removing!.id); setRemoving(null); }}>Delete</Button>
        </>}
      >
        <p className="text-sm text-muted">The series in it stay in your library.</p>
      </Dialog>
    </main>
  );
}
