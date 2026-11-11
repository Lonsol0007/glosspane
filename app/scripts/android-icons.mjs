// Renders the launcher icons for the Android wrapper from the app's own mark.
//   node scripts/android-icons.mjs
import { chromium } from "@playwright/test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const res = "android/app/src/main/res";
const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

// The mark without its rounded background, so it can sit on any launcher shape.
const mark = `<g><rect x="12" y="12" width="26" height="40" rx="4" fill="#ece1d8"/><path d="M18 22h14M18 29h14M18 36h9" stroke="#16130f" stroke-width="3" stroke-linecap="round"/><rect x="30" y="30" width="24" height="18" rx="9" fill="#ffb77c"/><path d="M37 39h10" stroke="#4a2800" stroke-width="3" stroke-linecap="round"/></g>`;
const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">${inner}</svg>`;
const variants = {
  "ic_launcher.png": [1, svg(`<rect width="64" height="64" rx="14" fill="#16130f"/>${mark}`)],
  "ic_launcher_round.png": [1, svg(`<circle cx="32" cy="32" r="32" fill="#16130f"/><g transform="translate(6.4 6.4) scale(0.8)">${mark}</g>`)],
  // Adaptive foreground: 108dp canvas, artwork inside the central 66dp safe zone.
  "ic_launcher_foreground.png": [108 / 48, svg(`<g transform="translate(14 14) scale(0.5625)">${mark}</g>`)],
};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [density, base] of Object.entries(sizes)) {
  for (const [name, [scale, markup]] of Object.entries(variants)) {
    const px = Math.round(base * scale);
    await page.setViewportSize({ width: px, height: px });
    await page.setContent(`<body style="margin:0;background:transparent">${markup}</body>`);
    writeFileSync(`${res}/mipmap-${density}/${name}`, await page.screenshot({ omitBackground: true }));
  }
}
await browser.close();

const bg = `${res}/values/ic_launcher_background.xml`;
if (existsSync(bg)) writeFileSync(bg, readFileSync(bg, "utf8").replace(/#[0-9A-Fa-f]{6,8}/, "#16130F"));
console.log("launcher icons written");
