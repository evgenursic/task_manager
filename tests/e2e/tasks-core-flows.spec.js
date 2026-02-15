const { test, expect } = require("@playwright/test");

/**
 * @param {Date} value
 */
function toDatetimeLocal(value) {
  const pad = (num) => String(num).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ title: string; notes?: string; dueAt?: Date; priority?: "LOW" | "MEDIUM" | "HIGH" }} input
 */
async function createTask(page, input) {
  await page.getByRole("button", { name: "New task" }).click();

  const dialog = page.getByRole("dialog", { name: "Create task" });
  await dialog.getByLabel("Title").fill(input.title);

  if (input.notes !== undefined) {
    await dialog.getByLabel("Notes").fill(input.notes);
  }

  if (input.dueAt) {
    await dialog.getByLabel("Due date and time").fill(toDatetimeLocal(input.dueAt));
  }

  if (input.priority) {
    await dialog.getByLabel("Priority").selectOption(input.priority);
  }

  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("article", { name: `Task ${input.title}` })).toBeVisible();
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} title
 */
async function openTaskActions(page, title) {
  const article = page.getByRole("article", { name: `Task ${title}` });
  await article.getByRole("button", { name: `Open actions for ${title}` }).click();
}

test.describe("tasks core flows", () => {
  test("keyboard shortcuts focus search and open/close new task dialog", async ({ page }) => {
    await page.goto("/tasks");

    await page.keyboard.press("/");
    const searchInput = page.getByLabel("Search tasks");
    await expect(searchInput).toBeFocused();

    // Should not open while typing in an input.
    await page.keyboard.press("n");
    await expect(page.getByRole("dialog", { name: "Create task" })).toHaveCount(0);

    await page.getByRole("heading", { name: "Tasks", level: 1 }).click();
    await page.keyboard.press("n");
    await expect(page.getByRole("dialog", { name: "Create task" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Create task" })).toBeHidden();
  });

  test("create task appears in list", async ({ page }) => {
    const title = `E2E Create ${Date.now()}`;

    await page.goto("/tasks");
    await createTask(page, { title, notes: "created in e2e" });

    await page.reload();
    await expect(page.getByRole("article", { name: `Task ${title}` })).toBeVisible();
  });

  test("toggle done updates task UI", async ({ page }) => {
    const title = `E2E Toggle ${Date.now()}`;

    await page.goto("/tasks");
    await createTask(page, { title });

    const article = page.getByRole("article", { name: `Task ${title}` });
    await article.getByRole("button", { name: `Mark ${title} as done` }).click();
    await expect(article.getByRole("button", { name: `Mark ${title} as open` })).toBeVisible();
  });

  test("edit task persists updated values", async ({ page }) => {
    const title = `E2E Edit ${Date.now()}`;
    const updatedTitle = `${title} Updated`;

    await page.goto("/tasks");
    await createTask(page, { title, notes: "before edit" });

    await openTaskActions(page, title);
    await page.getByRole("menuitem", { name: "Edit" }).click();

    const dialog = page.getByRole("dialog", { name: "Edit task" });
    await dialog.getByLabel("Title").fill(updatedTitle);
    await dialog.getByLabel("Notes").fill("after edit");
    await dialog.getByRole("button", { name: "Save changes" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole("article", { name: `Task ${updatedTitle}` })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("article", { name: `Task ${updatedTitle}` })).toBeVisible();
  });

  test("delete task removes it after confirmation", async ({ page }) => {
    const title = `E2E Delete ${Date.now()}`;

    await page.goto("/tasks");
    await createTask(page, { title });

    await openTaskActions(page, title);
    await page.getByRole("menuitem", { name: "Delete" }).click();

    const dialog = page.getByRole("dialog", { name: "Delete task?" });
    await dialog.getByRole("button", { name: "Delete task" }).click();

    await expect(page.getByRole("article", { name: `Task ${title}` })).toHaveCount(0);
  });

  test("overdue and done filters show expected tasks", async ({ page }) => {
    const suffix = Date.now();
    const overdueTitle = `E2E Overdue ${suffix}`;
    const doneTitle = `E2E Done ${suffix}`;
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

    await page.goto("/tasks");
    await createTask(page, { title: overdueTitle, dueAt: pastDate, priority: "HIGH" });
    await createTask(page, { title: doneTitle });

    const doneArticle = page.getByRole("article", { name: `Task ${doneTitle}` });
    await doneArticle.getByRole("button", { name: `Mark ${doneTitle} as done` }).click();
    await expect(
      doneArticle.getByRole("button", { name: `Mark ${doneTitle} as open` })
    ).toBeVisible();

    const filters = page.getByRole("region", { name: "Task filters" });
    await filters.getByRole("tab", { name: "Overdue" }).click();
    await expect(filters.getByRole("tab", { name: "Overdue" })).toHaveAttribute(
      "data-state",
      "active"
    );
    await expect(page.getByRole("article", { name: `Task ${overdueTitle}` })).toBeVisible();
    await expect(page.getByRole("article", { name: `Task ${doneTitle}` })).toHaveCount(0);

    await filters.getByRole("tab", { name: "Done" }).click();
    await expect(filters.getByRole("tab", { name: "Done" })).toHaveAttribute(
      "data-state",
      "active"
    );
    await expect(page.getByRole("article", { name: `Task ${doneTitle}` })).toBeVisible();
    await expect(page.getByRole("article", { name: `Task ${overdueTitle}` })).toHaveCount(0);
  });
});
