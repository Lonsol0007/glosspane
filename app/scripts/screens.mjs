// Captures the clone's screens into replica/clone-screens for replica-diff and review.
// Run with the production server up:  npx next start -p 3217  then  node scripts/screens.mjs
import { chromium } from "@playwright/test";
import { zipSync } from "fflate";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3217";
const OUT = new URL("../../replica/clone-screens/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

// Original sample pages, drawn here: panels, speech bubbles and a few lines of Japanese.
async function samplePages(count) {
  const page = await browser.newPage();
  const urls = await page.evaluate((count) => {
    const lines = [["おはよう！", "今日は早いね。"], ["船はもう出た？", "まだだよ。"], ["急ごう！", "待って！"], ["海がきれい…", "うん。"]];
    return Array.from({ length: count }, (_, i) => {
      const c = document.createElement("canvas");
      c.width = 800;
      c.height = 1200;
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, 800, 1200);
      g.lineWidth = 6;
      g.strokeStyle = "#111";
      const panels = [[30, 30, 740, 520], [30, 580, 350, 590], [410, 580, 360, 590]];
      panels.forEach(([x, y, w, h], p) => {
        g.fillStyle = ["#dfe6ee", "#eee4d8", "#e2eedf"][(p + i) % 3];
        g.fillRect(x, y, w, h);
        g.strokeRect(x, y, w, h);
        g.fillStyle = "#333";
        g.beginPath();
        g.arc(x + w * 0.3, y + h * 0.72, 60, 0, 7);
        g.fill();
        g.fillRect(x + w * 0.3 - 50, y + h * 0.72 + 50, 100, h * 0.2);
      });
      const bubbles = [[520, 170, 190, 110], [220, 760, 130, 90]];
      bubbles.forEach(([cx, cy, rx, ry], b) => {
        g.fillStyle = "#fff";
        g.beginPath();
        g.ellipse(cx, cy, rx, ry, 0, 0, 7);
        g.fill();
        g.stroke();
        g.fillStyle = "#111";
        g.font = "bold 40px sans-serif";
        g.textAlign = "center";
        g.fillText(lines[i % lines.length][b], cx, cy + 14);
      });
      return c.toDataURL("image/jpeg", 0.9);
    });
  }, count);
  await page.close();
  return urls.map((u) => Buffer.from(u.split(",")[1], "base64"));
}

function cbz(name, pages) {
  const files = {};
  pages.forEach((p, i) => (files[`${String(i + 1).padStart(3, "0")}.jpg`] = p));
  return { name, mimeType: "application/zip", buffer: Buffer.from(zipSync(files)) };
}

const pages = await samplePages(4);
writeFileSync(new URL("sample-page.jpg", OUT), pages[0]);

const blocks = [
  { bbox: [0.5, 0.108, 0.3, 0.07], source: "おはよう！", sourceLang: "Japanese", translation: "Good morning!" },
  { bbox: [0.1, 0.596, 0.35, 0.075], source: "今日は早いね。", sourceLang: "Japanese", translation: "You're up early today." },
];

for (const [label, viewport] of [["mobile", { width: 390, height: 844 }], ["desktop", { width: 1440, height: 900 }]]) {
  const context = await browser.newContext({ viewport, colorScheme: "dark" });
  const page = await context.newPage();
  const shot = (id) => page.screenshot({ path: new URL(`${id}-${label}.png`, OUT).pathname.replace(/^\/([A-Za-z]:)/, "$1") });
  await page.route("**/api/translate", (r) => r.fulfill({ json: { blocks } }));

  await page.goto(BASE);
  await page.getByText("Nothing on the shelf yet").waitFor();
  await shot("S01-library-empty");

  for (const [title, files] of [["Harbour Days", ["Harbour Days c001.cbz", "Harbour Days c002.cbz", "Harbour Days c003.cbz"]], ["Paper Lanterns", ["Paper Lanterns c001.cbz"]], ["North Wind", ["North Wind c001.cbz", "North Wind c002.cbz"]]]) {
    await page.goto(`${BASE}/browse`);
    if (title === "Harbour Days") await shot("S04-add");
    await page.getByTestId("file-input").setInputFiles(files.map((f, i) => cbz(f, [...pages.slice(i % 4), ...pages.slice(0, i % 4)])));
    const dialog = page.getByRole("dialog", { name: "Add to library" });
    await dialog.waitFor();
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForURL(/\/manga\/?\?id=\d+/);
  }
  await page.goto(`${BASE}/settings`);
  await page.getByLabel("Anthropic API key").fill("sk-ant-screenshot-000000000000000");
  await page.getByRole("button", { name: "Save" }).click();
  await shot("S10-settings");

  await page.goto(`${BASE}/manga?id=1`);
  await page.getByRole("link", { name: "Start" }).waitFor();
  await shot("S06-series");
  await page.getByRole("link", { name: "Start" }).click();
  await page.getByRole("img", { name: "Page 1 of 4" }).waitFor();
  await shot("S07-reader");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Translate" });
  await panel.getByRole("button", { name: "Translate", exact: true }).click();
  await panel.getByTestId("block-editor").first().waitFor();
  await shot("T01-translate-panel");
  await page.keyboard.press("Escape");
  await page.keyboard.press("m");
  await page.waitForTimeout(300);
  await shot("T02-translated-page");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");

  await page.goto(BASE);
  await page.getByRole("link", { name: /Harbour Days/ }).waitFor();
  await page.waitForTimeout(300);
  await shot("S01-library");
  await page.goto(`${BASE}/history`);
  await page.getByText("Today").waitFor();
  await shot("S03-history");
  await page.goto(`${BASE}/updates`);
  await page.getByText("Today").waitFor();
  await shot("S02-new");
  await page.goto(`${BASE}/more`);
  await shot("S05-more");
  await page.goto(`${BASE}/more/stats`);
  await page.getByText("Chapters read").waitFor();
  await shot("S12-stats");
  await context.close();
}
await browser.close();
console.log("screens written to", OUT.pathname);
