import { readFileSync } from "node:fs";
import { a11y, cbz, expect, importFiles, test } from "./base";

const slider = (page: import("@playwright/test").Page) => page.getByRole("slider", { name: "Page" });

test.describe("F02 read a chapter", () => {
  test("F02-H1 start, turn pages, progress is saved, resume lands on the same page", async ({ page }) => {
    await importFiles(page, [cbz("Night Ferry c001.cbz", 4), cbz("Night Ferry c002.cbz", 3)]);
    await page.getByRole("link", { name: "Start" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of 4" })).toBeVisible();
    await a11y(page);

    // Default mode is right to left: the left arrow goes forward.
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("img", { name: "Page 3 of 4" })).toBeVisible();
    await expect(slider(page)).toHaveValue("3");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("img", { name: "Page 2 of 4" })).toBeVisible();

    // F02-E1 refresh mid-chapter keeps the place
    await page.reload();
    await expect(page.getByRole("img", { name: "Page 2 of 4" })).toBeVisible();

    await page.getByRole("link", { name: "Back to series" }).click();
    await expect(page.getByText("Page 2 of 4")).toBeVisible();
    await page.getByRole("link", { name: "Resume" }).click();
    await expect(page.getByRole("img", { name: "Page 2 of 4" })).toBeVisible();
  });

  test("F02-H2 the last page marks the chapter read and the next key opens the next chapter", async ({ page }) => {
    await importFiles(page, [cbz("Night Ferry c001.cbz", 2), cbz("Night Ferry c002.cbz", 3)]);
    await page.getByRole("link", { name: "Start" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of 2" })).toBeVisible();
    await page.keyboard.press("Space");
    await expect(page.getByRole("img", { name: "Page 2 of 2" })).toBeVisible();
    await page.keyboard.press("Space");
    await expect(page.getByRole("img", { name: "Page 1 of 3" })).toBeVisible();
    await expect(page.getByText("Night Ferry c002")).toBeVisible();

    // F02-E2 previous from the first page goes back a chapter; the first chapter has nowhere to go
    await page.getByRole("button", { name: "Previous chapter" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of 2" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous chapter" })).toBeDisabled();

    await page.getByRole("link", { name: "Back to series" }).click();
    await expect(page.getByText("2 pages · read")).toBeVisible();
    await page.goto("/");
    await expect(page.getByLabel("1 unread")).toBeVisible();
  });

  test("F02-H3 tap zones, slider, left-to-right and long-strip modes", async ({ page }) => {
    await importFiles(page, [cbz("Modes c001.cbz", 4)]);
    await page.getByRole("link", { name: "Start" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of 4" })).toBeVisible();
    const view = page.getByTestId("reader-view");
    const box = (await view.boundingBox())!;

    await page.mouse.click(box.x + box.width * 0.1, box.y + box.height / 2); // left edge = forward in RTL
    await expect(page.getByRole("img", { name: "Page 2 of 4" })).toBeVisible();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); // centre hides the controls
    await expect(page.getByRole("button", { name: "Reader settings" })).toHaveCount(0);
    await page.keyboard.press("m");

    await slider(page).fill("4");
    await expect(page.getByRole("img", { name: "Page 4 of 4" })).toBeVisible();

    await page.getByRole("button", { name: "Reader settings" }).click();
    await page.getByRole("radio", { name: "Left to right" }).click();
    await expect(page.getByRole("radio", { name: "Left to right" })).toBeChecked();
    await page.keyboard.press("Escape");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("img", { name: "Page 3 of 4" })).toBeVisible();

    await page.getByRole("button", { name: "Reader settings" }).click();
    await a11y(page);
    await page.getByRole("radio", { name: "Long strip" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("img", { name: /Page \d of 4/ })).toHaveCount(4);
  });

  test("F02-N1 a chapter that does not exist says so", async ({ page }) => {
    await page.goto("/reader?c=9999");
    await expect(page.getByText("Chapter not found")).toBeVisible();
    await page.goto("/manga?id=9999");
    await expect(page.getByText("Series not found")).toBeVisible();
  });

  test("F02-E3 works at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await importFiles(page, [cbz("Phone c001.cbz", 3)]);
    await page.getByRole("link", { name: "Start" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of 3" })).toBeVisible();
    const img = page.getByRole("img", { name: "Page 1 of 3" });
    await expect(img).toBeVisible();
    const box = (await img.boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe("F03 history and F05 progress", () => {
  test("F03-H1 an opened chapter is in history and resumes; removing and clearing work", async ({ page }) => {
    await page.goto("/history");
    await expect(page.getByText("No reading history")).toBeVisible();
    await a11y(page);
    await importFiles(page, [cbz("Night Ferry c001.cbz", 4)]);
    await page.getByRole("link", { name: "Start" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of 4" })).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("img", { name: "Page 2 of 4" })).toBeVisible();

    await page.goto("/history");
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
    await a11y(page);
    await page.getByRole("link", { name: /Night Ferry c001/ }).click();
    await expect(page.getByRole("img", { name: "Page 2 of 4" })).toBeVisible();

    await page.goto("/history");
    await page.getByRole("button", { name: "Clear all history" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("No reading history")).toBeVisible();
  });

  test("F03-E1 private reading leaves no history and no progress", async ({ page }) => {
    await importFiles(page, [cbz("Secret c001.cbz", 4)]);
    await page.goto("/more");
    await page.getByRole("switch", { name: "Private reading" }).check();
    await page.goto("/");
    await page.getByRole("link", { name: /Secret/ }).click();
    await page.getByRole("link", { name: "Start" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of 4" })).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("img", { name: "Page 2 of 4" })).toBeVisible();
    await page.goto("/history");
    await expect(page.getByText("No reading history")).toBeVisible();
  });

  test("F05-H1 mark read, bookmark, mark earlier as read, filter", async ({ page }) => {
    await importFiles(page, [cbz("Marks c001.cbz", 2), cbz("Marks c002.cbz", 2), cbz("Marks c003.cbz", 2)]);
    await page.getByRole("button", { name: "Actions for Marks c003" }).click();
    await page.getByRole("menuitem", { name: "Mark earlier chapters as read" }).click();
    await expect(page.getByText("2 pages · read")).toHaveCount(2);
    await page.getByRole("button", { name: "Actions for Marks c003" }).click();
    await page.getByRole("menuitem", { name: "Bookmark" }).click();
    await expect(page.getByLabel("Bookmarked")).toBeVisible();

    await page.getByRole("button", { name: "Filter and sort chapters" }).click();
    await page.getByRole("switch", { name: "Unread only" }).check();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: /Marks c00/ })).toHaveCount(1);
    await page.goto("/");
    await expect(page.getByLabel("1 unread")).toBeVisible();

    await page.goto("/updates");
    await expect(page.getByRole("link", { name: /Marks c003/ })).toBeVisible();
    await a11y(page);
    await page.goto("/more/stats");
    await expect(page.getByText("Chapters read")).toBeVisible();
    await a11y(page);
  });

  test("F05-H2 edit details and notes", async ({ page }) => {
    await importFiles(page, [cbz("Edit c001.cbz", 2)]);
    await page.getByRole("button", { name: "Edit details" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit details" });
    await dialog.getByLabel("Author").fill("A. Writer");
    await dialog.getByLabel("Genres, separated by commas").fill("Drama, Sea");
    await dialog.getByLabel("Your notes").fill("Lent by a friend");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("A. Writer")).toBeVisible();
    await expect(page.getByText("Sea", { exact: true })).toBeVisible();
    await expect(page.getByText("Lent by a friend")).toBeVisible();
    await a11y(page);
  });
});

test.describe("F06 back up and restore", () => {
  test("F06-H1 backup, wipe, restore brings back the library and progress; re-import attaches pages", async ({ page }) => {
    await importFiles(page, [cbz("Keep c001.cbz", 3)]);
    await page.getByRole("link", { name: "Start" }).click();
    await expect(page.getByRole("img", { name: "Page 1 of 3" })).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("img", { name: "Page 2 of 3" })).toBeVisible();

    await page.goto("/settings");
    await a11y(page);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Create backup" }).click();
    const file = await (await download).path();
    const backup = readFileSync(file, "utf8");
    expect(JSON.parse(backup).manga).toHaveLength(1);

    await page.getByRole("button", { name: "Delete everything" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await page.goto("/");
    await expect(page.getByText("Nothing on the shelf yet")).toBeVisible();

    await page.goto("/settings");
    await page.getByTestId("restore-input").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(backup) });
    await expect(page.getByText(/Restored 1 series and 1 chapters/)).toBeVisible();
    await page.goto("/");
    await page.getByRole("link", { name: /Keep/ }).click();
    await expect(page.getByText("Pages missing")).toBeVisible();

    await importFiles(page, [cbz("Keep c001.cbz", 3)]);
    await expect(page.getByText("Page 2 of 3")).toBeVisible();
  });

  test("F06-N1 a file that is not a backup is refused", async ({ page }) => {
    await page.goto("/settings");
    await page.getByTestId("restore-input").setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from('{"hello":1}') });
    await expect(page.getByRole("alert").filter({ hasText: "not a backup made by this app" })).toBeVisible();
    await page.getByTestId("restore-input").setInputFiles({ name: "y.json", mimeType: "application/json", buffer: Buffer.from("not json") });
    await expect(page.getByRole("alert").filter({ hasText: "not a backup made by this app" })).toHaveCount(2);
  });

  test("theme choice is applied and kept", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("radio", { name: "Dark" }).check();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await a11y(page);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
