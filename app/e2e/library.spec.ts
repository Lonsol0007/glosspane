import { a11y, cbz, expect, importFiles, png, test } from "./base";

test.describe("F01 import a series", () => {
  test("F01-H1 empty library points to Add; importing an archive creates the series", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Nothing on the shelf yet")).toBeVisible();
    await a11y(page);
    await page.getByRole("link", { name: "Add your first series" }).click();
    await expect(page).toHaveURL(/\/browse/);
    await a11y(page);

    await importFiles(page, [cbz("Night Ferry c001.cbz"), cbz("Night Ferry c002.cbz", 3)]);
    await expect(page.getByRole("heading", { level: 1, name: "Night Ferry" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "2 chapters" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start" })).toBeVisible();
    await a11y(page);

    await page.goto("/");
    await expect(page.getByRole("link", { name: /Night Ferry/ })).toBeVisible();
    await expect(page.getByLabel("2 unread")).toBeVisible();
    await a11y(page);
  });

  test("F01-E1 the same file twice adds nothing", async ({ page }) => {
    await importFiles(page, [cbz("Dup c001.cbz")]);
    await importFiles(page, [cbz("Dup c001.cbz")]);
    await expect(page.getByText("Already in your library")).toBeVisible();
    await expect(page.getByRole("heading", { name: "1 chapter" })).toBeVisible();
  });

  test("F01-E2 a second archive under the same title becomes a new chapter", async ({ page }) => {
    await importFiles(page, [cbz("Dup c001.cbz")]);
    await importFiles(page, [cbz("Dup c002.cbz")]);
    await expect(page.getByRole("heading", { name: "2 chapters" })).toBeVisible();
  });

  test("F01-N1 unusable files are named with a reason", async ({ page }) => {
    await page.goto("/browse");
    await page.getByTestId("file-input").setInputFiles([
      { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
      { name: "broken.cbz", mimeType: "application/zip", buffer: Buffer.from("not a zip at all") },
    ]);
    const alert = page.getByRole("alert").filter({ hasText: "left out" });
    await expect(alert).toContainText("notes.txt");
    await expect(alert).toContainText("broken.cbz");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("F01-E3 loose images import as one chapter; long and accented titles survive", async ({ page }) => {
    const title = "Élan Vital 🚀 — a very long series title that keeps going past sixty characters";
    await importFiles(page, [1, 2, 3].map((n) => ({ name: `p${n}.png`, mimeType: "image/png", buffer: png(120, 180, [240, 240, 240]) })), title);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("3 pages")).toBeVisible();
  });

  test("F01-N2 an empty title cannot be saved", async ({ page }) => {
    await page.goto("/browse");
    await page.getByTestId("file-input").setInputFiles([cbz("X.cbz")]);
    const dialog = page.getByRole("dialog", { name: "Add to library" });
    await dialog.getByLabel("Series title").fill("   ");
    await expect(dialog.getByRole("button", { name: "Add", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("alert")).toHaveText("A series needs a title.");
  });
});

test.describe("F04 organise the library", () => {
  test("F04-H1 create a category, assign a series, see the tab; delete keeps the series", async ({ page }) => {
    await importFiles(page, [cbz("Alpha c001.cbz")]);
    await importFiles(page, [cbz("Beta c001.cbz")]);
    await page.goto("/more/categories");
    await expect(page.getByText("No categories")).toBeVisible();
    await a11y(page);
    await page.getByRole("button", { name: "New category" }).first().click();
    await page.getByRole("dialog").getByLabel("Name").fill("Reading now");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Reading now")).toBeVisible();

    // F04-N1 duplicate name, case-insensitive
    await page.getByRole("button", { name: "New category" }).first().click();
    await page.getByRole("dialog").getByLabel("Name").fill("reading NOW");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("A category with that name already exists.");
    await page.keyboard.press("Escape");

    await page.goto("/");
    await page.getByRole("button", { name: "Select series" }).click();
    await page.getByRole("checkbox", { name: "Alpha" }).click();
    await page.getByRole("button", { name: "Set categories" }).click();
    await page.getByLabel("Reading now").check();
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("tab", { name: "Default" })).toBeVisible();
    await page.getByRole("tab", { name: "Reading now" }).click();
    await expect(page.getByRole("link", { name: /Alpha/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Beta/ })).toHaveCount(0);
    await a11y(page);

    await page.goto("/more/categories");
    await page.getByRole("button", { name: "Delete Reading now" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await page.goto("/");
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Alpha/ })).toBeVisible();
  });

  test("F04-H2 search, sort, filter and layout", async ({ page }) => {
    await importFiles(page, [cbz("Alpha c001.cbz")]);
    await importFiles(page, [cbz("Beta c001.cbz")]);
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByLabel("Search your library").fill("bet");
    await expect(page.getByRole("link", { name: /Beta/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Alpha/ })).toHaveCount(0);
    await page.getByLabel("Search your library").fill("zzz");
    await expect(page.getByText("No matches")).toBeVisible();
    await page.getByRole("button", { name: "Close search" }).click();

    await page.getByRole("button", { name: "Filter, sort and display" }).click();
    await page.getByRole("switch", { name: "Reverse order" }).check();
    await page.getByRole("radio", { name: "List", exact: true }).check();
    await page.keyboard.press("Escape");
    const items = page.getByRole("listitem").getByRole("link");
    await expect(items.first()).toContainText("Beta");

    await page.getByRole("button", { name: "Filter, sort and display" }).click();
    await page.getByRole("switch", { name: "Finished" }).check();
    await page.keyboard.press("Escape");
    await expect(page.getByText("No series match the filters")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(items).toHaveCount(2);
  });

  test("F04-H3 delete a series from the library", async ({ page }) => {
    await importFiles(page, [cbz("Alpha c001.cbz")]);
    await page.goto("/");
    await page.getByRole("button", { name: "Select series" }).click();
    await page.getByRole("checkbox", { name: "Alpha" }).click();
    await page.getByRole("toolbar").getByRole("button", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Nothing on the shelf yet")).toBeVisible();
  });
});

test("landing, privacy and terms pages render and pass the accessibility scan", async ({ page }) => {
  for (const [path, heading] of [["/welcome", "Read any comic in your language."], ["/privacy", "Privacy"], ["/terms", "Terms of use"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await a11y(page);
  }
});
