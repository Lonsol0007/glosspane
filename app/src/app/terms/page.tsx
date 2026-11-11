import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-muted">
      <Link href="/" className="text-sm font-semibold text-accent">Back to {brand.name}</Link>
      <h1 className="mt-4 text-3xl font-bold">Terms of use</h1>
      <p>Last updated 11 November 2026.</p>
      <h2>What {brand.name} is</h2>
      <p>{brand.name} is a reader for comic files you already have, with a tool that translates pages using your own API key. It includes no comics and connects to no catalogue, store or download source.</p>
      <h2>Your files</h2>
      <p>You are responsible for the files you open. Only add files you have the right to use, and only translate pages for your own reading unless the rights holder allows more. Do not share translated pages of works you do not own.</p>
      <h2>Translation</h2>
      <p>Translation is done by a third-party AI model on your own account with that provider; you pay them for what you use. Machine translation makes mistakes, including in names, tone and meaning. Do not rely on it where accuracy matters.</p>
      <h2>Your data</h2>
      <p>Everything is stored in your browser. Browsers can clear stored data, for example when the device runs low on space. Keep your original files and make backups; we cannot recover anything for you.</p>
      <h2>No warranty</h2>
      <p>The app is provided as it is, without warranties of any kind, and to the extent the law allows we are not liable for loss arising from its use.</p>
      <h2>Changes</h2>
      <p>If these terms change, the date above changes with them.</p>
    </main>
  );
}
