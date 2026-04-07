import { expect, test, type Page } from "@playwright/test";
import { allRoutes, protectedRoutes } from "./routes";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://lvh.me:3000";

async function openRoute(page: Page, path: string, role?: "management" | "developer") {
  if (role) {
    await page.context().addCookies([
      {
        name: "role",
        value: role,
        url: baseURL,
      },
    ]);
  }

  await page.goto(path, { waitUntil: "domcontentloaded" });
}

for (const route of allRoutes) {
  test(`renders ${route.path}`, async ({ page }) => {
    await openRoute(page, route.path, route.role);

    expect(new URL(page.url()).pathname).toBe(route.path);
    await expect(page.locator("body")).toContainText(route.expectedText);
  });
}

test("redirects a management user away from developer routes", async ({ page }) => {
  const deniedRoute = protectedRoutes.find((route) => route.role === "developer");

  if (!deniedRoute) {
    throw new Error("Developer routes were not configured.");
  }

  await openRoute(page, deniedRoute.path, "management");

  expect(new URL(page.url()).pathname).toBe("/management");
  await expect(page.locator("body")).toContainText("Management Dashboard");
});