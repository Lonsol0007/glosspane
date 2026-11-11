import { unzip } from "fflate";
import type { ImportChapter } from "./repo";
import { isArchiveName, isImageName, mediaTypeFor, naturalCompare, seriesTitleFromFilename, stripExt } from "./util";

export const MAX_ARCHIVE_BYTES = 1024 ** 3;

export interface ReadResult {
  suggestedTitle: string;
  chapters: ImportChapter[];
  /** Files that could not be used, each with the reason. */
  skipped: { name: string; reason: string }[];
}

function unzipImages(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    unzip(data, { filter: (f) => isImageName(f.name) }, (err, files) => (err ? reject(err) : resolve(files)));
  });
}

/** Turns picked files into chapters. An archive is one chapter, or one per folder when it holds several folders of images. */
export async function readFiles(files: File[]): Promise<ReadResult> {
  const chapters: ImportChapter[] = [];
  const skipped: ReadResult["skipped"] = [];
  const sorted = [...files].sort((a, b) => naturalCompare(a.name, b.name));
  const archives = sorted.filter((f) => isArchiveName(f.name));
  const images = sorted.filter((f) => !isArchiveName(f.name) && isImageName(f.name));
  for (const f of sorted) {
    if (!archives.includes(f) && !images.includes(f)) skipped.push({ name: f.name, reason: "not a .cbz, .zip or image file" });
  }

  for (const file of archives) {
    if (file.size > MAX_ARCHIVE_BYTES) {
      skipped.push({ name: file.name, reason: "larger than 1 GB" });
      continue;
    }
    let entries: Record<string, Uint8Array>;
    try {
      entries = await unzipImages(new Uint8Array(await file.arrayBuffer()));
    } catch {
      skipped.push({ name: file.name, reason: "could not be opened as an archive" });
      continue;
    }
    const byDir = new Map<string, string[]>();
    for (const path of Object.keys(entries)) {
      const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
      byDir.set(dir, [...(byDir.get(dir) ?? []), path]);
    }
    if (byDir.size === 0) {
      skipped.push({ name: file.name, reason: "has no images inside" });
      continue;
    }
    const dirs = [...byDir.keys()].sort(naturalCompare);
    for (const dir of dirs) {
      const paths = byDir.get(dir)!.sort(naturalCompare);
      chapters.push({
        url: dirs.length > 1 ? `${file.name}:${file.size}:${dir}` : `${file.name}:${file.size}`,
        name: dirs.length > 1 ? dir.split("/").pop() || stripExt(file.name) : stripExt(file.name),
        pages: paths.map((p) => new Blob([entries[p] as BlobPart], { type: mediaTypeFor(p) })),
      });
    }
  }

  if (images.length > 0) {
    const total = images.reduce((n, f) => n + f.size, 0);
    chapters.push({
      url: `images:${images.length}:${total}:${images[0].name}`,
      name: archives.length ? "Loose pages" : "Chapter 1",
      pages: images,
    });
  }

  const first = archives[0]?.name ?? images[0]?.name ?? "";
  return { suggestedTitle: first ? seriesTitleFromFilename(first) : "", chapters, skipped };
}

/** A small JPEG of the first page, so the library never decodes full pages. */
export async function makeCover(page: Blob | undefined): Promise<Blob | null> {
  if (!page) return null;
  try {
    const bitmap = await createImageBitmap(page);
    const width = Math.min(360, bitmap.width);
    const height = Math.round((bitmap.height / bitmap.width) * width);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.8));
  } catch {
    return null;
  }
}
