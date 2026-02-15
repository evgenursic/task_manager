const { test, expect } = require("@playwright/test");

const E2E_USER_COOKIE_NAME = "taskflow-e2e-user-email";

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ title: string }} input
 */
async function createTask(page, input) {
  await page.getByRole("button", { name: "New task" }).click();

  const dialog = page.getByRole("dialog", { name: "Create task" });
  await dialog.getByLabel("Title").fill(input.title);
  await dialog.getByRole("button", { name: "Create task" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("article", { name: `Task ${input.title}` })).toBeVisible();
}

test.describe("task ownership isolation", () => {
  test("user B cannot see tasks created by user A", async ({ browser, baseURL }) => {
    if (!baseURL) {
      throw new Error("Expected baseURL for E2E run.");
    }

    const suffix = Date.now();
    const userAEmail = `user-a-${suffix}@taskflow.local`;
    const userBEmail = `user-b-${suffix}@taskflow.local`;
    const userATaskTitle = `E2E Owned Task ${suffix}`;

    const contextA = await browser.newContext();
    await contextA.addCookies([
      {
        name: E2E_USER_COOKIE_NAME,
        value: userAEmail,
        url: baseURL,
      },
    ]);

    const pageA = await contextA.newPage();
    await pageA.goto("/tasks");
    await expect(pageA).toHaveURL(/\/tasks/);

    await createTask(pageA, { title: userATaskTitle });
    await pageA.reload();
    await expect(pageA.getByRole("article", { name: `Task ${userATaskTitle}` })).toBeVisible();

    const contextB = await browser.newContext();
    await contextB.addCookies([
      {
        name: E2E_USER_COOKIE_NAME,
        value: userBEmail,
        url: baseURL,
      },
    ]);

    const pageB = await contextB.newPage();
    await pageB.goto("/tasks");
    await expect(pageB).toHaveURL(/\/tasks/);
    await expect(pageB.getByRole("article", { name: `Task ${userATaskTitle}` })).toHaveCount(0);

    await pageB.getByLabel("Search tasks").fill(userATaskTitle);
    await pageB.getByRole("button", { name: "Search" }).click();
    await expect
      .poll(() => {
        return new URL(pageB.url()).searchParams.get("query");
      })
      .toBe(userATaskTitle);
    await expect(pageB.getByRole("article", { name: `Task ${userATaskTitle}` })).toHaveCount(0);

    await contextA.close();
    await contextB.close();
  });
});
