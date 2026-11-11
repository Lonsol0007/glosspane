"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, Dialog, SectionTitle, Segmented, Select, Switch, TextField, TopBar, useToast } from "@/components/ui";
import { brand } from "@/lib/brand";
import { isNative } from "@/lib/platform";
import { defaultPrefs, LANGUAGES, resetPrefsCache, setApiKey, setPrefs, useApiKey, usePrefs, type Prefs } from "@/lib/prefs";
import { clearDatabase, exportBackup, restoreBackup } from "@/lib/repo";
import { formatBytes } from "@/lib/util";

const MODELS = [
  { value: "claude-opus-5-5", label: "Claude Opus 5.5 (most accurate)" },
  { value: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (balanced)" },
  { value: "claude-haiku-5-5", label: "Claude Haiku 5.5 (fastest, cheapest)" },
];

export default function SettingsPage() {
  const prefs = usePrefs();
  const apiKey = useApiKey();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [keyDraft, setKeyDraft] = useState("");
  const [usage, setUsage] = useState<{ usage?: number; quota?: number } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshUsage = () => navigator.storage?.estimate?.().then(setUsage).catch(() => {});
  useEffect(() => {
    refreshUsage();
  }, []);

  const backup = async () => {
    setBusy(true);
    try {
      const data = await exportBackup(prefs);
      const name = `${brand.name.toLowerCase()}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      if (isNative) {
        // A WebView cannot download a blob. Write the file to the app's cache and hand it to the share sheet.
        const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
        const file = await Filesystem.writeFile({ path: name, data: JSON.stringify(data), directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: name, files: [file.uri] });
      } else {
        const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast(`Backup saved: ${data.manga.length} series, ${data.chapters.length} chapters.`);
    } catch {
      toast("The backup could not be created.", "error");
    } finally {
      setBusy(false);
    }
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      let raw: unknown;
      try {
        raw = JSON.parse(await file.text());
      } catch {
        throw new Error("This file is not a backup made by this app.");
      }
      const summary = await restoreBackup(raw);
      if (summary.prefs) {
        const known = Object.fromEntries(Object.entries(summary.prefs).filter(([k, v]) => k in defaultPrefs && typeof v === typeof defaultPrefs[k as keyof Prefs]));
        setPrefs(known as Partial<Prefs>);
      }
      toast(`Restored ${summary.manga} series and ${summary.chapters} chapters. Add the files again to attach pages.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "The backup could not be restored.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto min-h-dvh max-w-2xl pb-16">
      <TopBar title="Settings" start={<Link href="/more" aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2"><ArrowLeft size={22} /></Link>} />

      <SectionTitle>Appearance</SectionTitle>
      <Segmented label="Theme" value={prefs.theme} onChange={(v) => setPrefs({ theme: v })} options={[{ value: "system", label: "Match device" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />

      <SectionTitle>Reader</SectionTitle>
      <Segmented label="Default reading mode" value={prefs.readingMode} onChange={(v) => setPrefs({ readingMode: v })} options={[{ value: "rtl", label: "Right to left" }, { value: "ltr", label: "Left to right" }, { value: "vertical", label: "Vertical" }, { value: "webtoon", label: "Long strip" }]} />
      <Switch label="Tap the sides to turn pages" checked={prefs.tapZones} onChange={(v) => setPrefs({ tapZones: v })} />
      <Switch label="Show page number" checked={prefs.showPageNumber} onChange={(v) => setPrefs({ showPageNumber: v })} />

      <div id="translation" className="scroll-mt-14">
        <SectionTitle>Translation</SectionTitle>
        <div className="px-4 py-2">
          {apiKey ? (
            <div className="flex items-center justify-between gap-4 rounded-md bg-surface p-4">
              <p className="min-w-0 text-sm"><span className="font-semibold">API key saved</span><span className="block truncate text-muted">ends in …{apiKey.slice(-4)}</span></p>
              <Button variant="danger" onClick={() => { setApiKey(""); toast("Key removed from this browser."); }}>Remove</Button>
            </div>
          ) : (
            <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (keyDraft.trim()) { setApiKey(keyDraft.trim()); setKeyDraft(""); toast("Key saved in this browser."); } }}>
              <TextField className="min-w-0 flex-1" label="Anthropic API key" type="password" autoComplete="off" placeholder="sk-ant-…" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
              <Button type="submit" disabled={!keyDraft.trim()}>Save</Button>
            </form>
          )}
          <p className="mt-2 text-sm text-muted">Translation uses your own key and you pay Anthropic for what you use. {isNative ? "The key is stored on this device only and is sent straight to Anthropic with each translation request. It is never put in backups." : "The key is stored in this browser only and is sent with each translation request, never saved on a server or put in backups."}</p>
        </div>
        <Select className="px-4 py-2" label="Translate into" value={prefs.targetLang} onChange={(v) => setPrefs({ targetLang: v })} options={LANGUAGES} />
        <Select className="px-4 py-2" label="Model" value={prefs.translationModel} onChange={(v) => setPrefs({ translationModel: v })} options={MODELS} />
        <Segmented label="Lettering" value={prefs.translationFont} onChange={(v) => setPrefs({ translationFont: v })} options={[{ value: "comic", label: "Comic" }, { value: "sans", label: "Plain" }]} />
        <Switch label="Cover the original text" description="Paints each text area with the colour around it before the translation is drawn." checked={prefs.cleanBubbles} onChange={(v) => setPrefs({ cleanBubbles: v })} />
        <Switch label="Translate pages as I open them" description="Uses your key for every new page you turn to." checked={prefs.autoTranslate} onChange={(v) => setPrefs({ autoTranslate: v })} />
      </div>

      <SectionTitle>Your data</SectionTitle>
      <div className="flex flex-wrap gap-2 px-4 py-2">
        <Button variant="tonal" onClick={backup} loading={busy}>Create backup</Button>
        <Button variant="tonal" onClick={() => fileInput.current?.click()} disabled={busy}>Restore backup</Button>
        <input ref={fileInput} data-testid="restore-input" type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { restore(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      <p className="px-4 text-sm text-muted">A backup holds your library list, categories, progress, history, translations and settings. Page images are not included; add the files again after restoring and progress is kept.</p>
      <p className="px-4 pt-3 text-sm">
        Storage used: <span className="font-semibold">{usage?.usage !== undefined ? formatBytes(usage.usage) : "unknown"}</span>
        {usage?.quota ? <span className="text-muted"> of about {formatBytes(usage.quota)} available</span> : null}
      </p>
      <div className="px-4 py-3">
        <Button variant="danger" className="border border-danger" onClick={() => setConfirmClear(true)}>Delete everything</Button>
      </div>

      <SectionTitle>About</SectionTitle>
      <p className="px-4 text-sm text-muted">{brand.name} reads files you already have. It ships no content and connects to no content sources. Everything stays on this device, except a page you choose to translate, which is sent to the translation provider.</p>
      <p className="px-4 pt-2 text-sm"><Link href="/privacy" className="font-semibold text-accent">Privacy</Link> · <Link href="/terms" className="font-semibold text-accent">Terms</Link></p>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Delete everything?"
        actions={<>
          <Button variant="text" onClick={() => setConfirmClear(false)}>Keep</Button>
          <Button variant="danger" onClick={async () => { await clearDatabase(); localStorage.removeItem("prefs"); setApiKey(""); resetPrefsCache(); setConfirmClear(false); refreshUsage(); toast("Everything was deleted from this device."); }}>Delete</Button>
        </>}
      >
        <p className="text-sm text-muted">Every series, page, category, translation, setting and your API key are removed from this device. This cannot be undone. Make a backup first if you want your progress back later.</p>
      </Dialog>
    </main>
  );
}
