import Link from "next/link";
import { brand } from "@/lib/brand";
import { isNative } from "@/lib/platform";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-2 [&_li]:text-muted [&_p]:mt-3 [&_p]:text-muted">
      <Link href="/" className="text-sm font-semibold text-accent">Back to {brand.name}</Link>
      <h1 className="mt-4 text-3xl font-bold">Privacy</h1>
      <p>Last updated 11 November 2026.</p>
      <h2>The short version</h2>
      <p>{brand.name} has no accounts and no database of its users. Your library, pages, reading progress, history, settings and translations are stored in your browser on your device, and stay there.</p>
      <h2>What leaves your device</h2>
      <ul className="list-disc pl-5">
        {isNative ? (
          <li><strong>A page you translate.</strong> When you run a translation, that page image and your API key are sent over HTTPS from this app straight to Anthropic, which reads and translates the page. Nothing passes through a server of ours. Anthropic handles the request under its own terms and privacy policy, on your API account.</li>
        ) : (
          <li><strong>A page you translate.</strong> When you run a translation, that page image and your API key are sent over HTTPS to our server, which passes them to Anthropic to read and translate the page. We do not store the image, the result or the key, and we do not log them. Anthropic handles the request under its own terms and privacy policy, on your API account.</li>
        )}
        {!isNative && <li><strong>Ordinary web requests.</strong> Our hosting provider, Vercel, receives the technical data any website sees (IP address, browser type, time of request) to deliver the app and stop abuse.</li>}
      </ul>
      <p>Nothing else is sent. There are no analytics, ads or trackers.</p>
      <h2>Processors</h2>
      <ul className="list-disc pl-5">
        {!isNative && <li>Vercel Inc. (hosting)</li>}
        <li>Anthropic PBC (translation, only when you start one, using your own key)</li>
      </ul>
      <h2>Your control</h2>
      <p>Settings, then &ldquo;Delete everything&rdquo;, removes all data the app holds on your device, including your API key. Clearing site data in your browser does the same. A backup file you create is yours; it contains your library list and progress, never page images or your API key.</p>
      <h2>Contact</h2>
      <p>Questions about this policy: use the contact address published on this site.</p>
    </main>
  );
}
