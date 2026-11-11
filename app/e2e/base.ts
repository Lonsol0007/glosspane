import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page } from "@playwright/test";
import { zipSync } from "fflate";
import { crc32, deflateSync } from "node:zlib";

// Every test fails on a console error or a 5xx response.
export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      // A 4xx the app handles (a rejected key, say) is logged by the browser as a failed resource; 5xx is caught below.
      page.on("console", (m) => m.type() === "error" && !/status of 4\d\d/.test(m.text()) && problems.push(`console: ${m.text()}`));
      page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
      page.on("response", (r) => r.status() >= 500 && problems.push(`${r.status()} ${r.url()}`));
      await use(problems);
      expect(problems, "console errors or 5xx responses").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** A solid-colour PNG, built by hand so the fixtures need no image files. */
export function png(width: number, height: number, [r, g, b]: [number, number, number]): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body) >>> 0, body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, Buffer.from([r, g, b]))]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const shades: [number, number, number][] = [[250, 250, 250], [220, 235, 250], [250, 235, 220], [230, 250, 230], [245, 225, 245]];

export function cbz(name: string, pages = 4) {
  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < pages; i++) files[`${String(i + 1).padStart(3, "0")}.png`] = png(200, 300, shades[i % shades.length]);
  return { name, mimeType: "application/zip", buffer: Buffer.from(zipSync(files)) };
}

export async function importFiles(page: Page, files: { name: string; mimeType: string; buffer: Buffer }[], title?: string) {
  await page.goto("/browse");
  await page.getByTestId("file-input").setInputFiles(files);
  const dialog = page.getByRole("dialog", { name: "Add to library" });
  await expect(dialog).toBeVisible();
  if (title !== undefined) await dialog.getByLabel("Series title").fill(title);
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await page.waitForURL(/\/manga\/?\?id=\d+/);
}

export async function a11y(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}
