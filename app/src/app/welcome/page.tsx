import Link from "next/link";
import { brand } from "@/lib/brand";
import { isNative } from "@/lib/platform";

export const metadata = { title: "Read any comic in your language" };

const steps = [
  ["Add your files", "Pick .cbz or .zip files, or page images. They are stored in your browser and go nowhere."],
  ["Open a chapter", "Right to left, left to right, vertical or long strip. Your place is kept for every chapter."],
  ["Press Translate", "The page is read and translated, and the translation is set over the original text. Tap once to see the original again."],
];

const features = [
  ["Translate where you read", "No separate editor, no project files, no graphics card. One page or the rest of the chapter, from inside the reader."],
  ["Fix what the machine got wrong", "Every line is editable. Your corrections stay when you translate the page again."],
  ["Any device with a browser", "Phone, tablet or computer. Add it to your home screen and it opens like an app."],
  ["Nothing to break", "No add-ons, no sources, no accounts. It reads the files you give it."],
  ["Yours to keep", "Library, progress and translations live on your device. One backup file moves them to another."],
  ["Organised your way", "Categories, bookmarks, notes, editable details, and a private mode that leaves no history."],
];

const faq = [
  ["Does it come with comics?", "No. It has no catalogue and no download sources. You add files you already have."],
  ["What does translation cost?", "The app is free. Translation uses your own Anthropic API key, and you pay Anthropic for what you use. The cost depends on the model you choose in Settings and how much text is on the page. Start with one chapter and check your usage before translating a whole series."],
  ["Where does my page go when I translate it?", isNative ? "Straight from this app to Anthropic, with your key. Nothing passes through a server of ours." : "To our server, which passes it straight to Anthropic with your key, and returns the result. We do not store the page, the result or the key."],
  ["How good is the translation?", "It reads well for most dialogue and it makes mistakes: names, jokes and text drawn into the artwork are the usual ones. That is why every line can be edited."],
  ["Does it cover up the artwork?", "It paints each text area with the colour around it and sets the translation on top. That is clean in speech bubbles and rougher where text sits on artwork. You can switch back to the original page with one tap."],
  ["Which files work?", ".cbz and .zip archives, and loose JPEG, PNG, WebP, GIF and AVIF images. Not .cbr, PDF or EPUB yet."],
  ["Can I move to another device?", "Make a backup in Settings and restore it on the other device, then add the same files there. Progress and translations are matched back to them. There is no automatic sync yet."],
];

export default function WelcomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24">
      <header className="flex h-16 items-center justify-between">
        <span className="text-xl font-bold tracking-tight">{brand.name}</span>
        <Link href="/" className="text-sm font-semibold text-accent">Open the app</Link>
      </header>

      <section className="grid items-center gap-10 py-12 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">Read any comic in your language.</h1>
          <p className="mt-4 text-lg text-muted">{brand.name} is a comic reader that translates the page you are on, in place. Your files, your device, your own API key.</p>
          <Link href="/browse" className="mt-8 inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-on-accent">Add a chapter and try it</Link>
          <p className="mt-3 text-sm text-muted">Free. No account. Translation needs an Anthropic API key.</p>
        </div>
        <img src="/shot-translated.png" alt="A comic page in the reader with its speech bubbles translated into English" width={390} height={844} className="mx-auto max-h-[70vh] w-auto rounded-lg border border-border shadow-pop" />
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-bold">The chapter exists. You just cannot read it.</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <p className="text-muted"><strong className="text-text">Reader apps show you what someone else already translated.</strong> When nobody has, or the place that had it is gone, the app has nothing for you. And the good ones tend to live on one kind of phone.</p>
          <p className="text-muted"><strong className="text-text">Translation tools are built for people making releases.</strong> A desktop program, a strong graphics card, a project per chapter, an export at the end. That is a lot of work to find out what happens next.</p>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-bold">How it works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="rounded-lg bg-surface p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft font-bold text-on-accent-soft">{i + 1}</span>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-bold">What you get</h2>
        <ul className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {features.map(([title, body]) => (
            <li key={title}>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-bold">Price</h2>
        <div className="mt-6 rounded-lg border border-border p-6 md:max-w-md">
          <p className="text-xl font-semibold">Free</p>
          <p className="mt-2 text-sm text-muted">The whole reader, with no limits and no account. Translation runs on your own Anthropic API key, billed to you by Anthropic at their rates.</p>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-bold">Questions</h2>
        <dl className="mt-6 divide-y divide-border">
          {faq.map(([q, a]) => (
            <div key={q} className="py-4">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-sm text-muted">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-lg bg-surface px-6 py-12 text-center">
        <h2 className="text-3xl font-bold">Open the chapter you could not read.</h2>
        <Link href="/browse" className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-on-accent">Add a chapter</Link>
      </section>

      <footer className="pt-10 text-sm text-muted">
        <Link href="/privacy" className="font-semibold text-accent">Privacy</Link> · <Link href="/terms" className="font-semibold text-accent">Terms</Link>
        <p className="mt-2">{brand.name} includes no comics. Only add files you have the right to use.</p>
      </footer>
    </main>
  );
}
