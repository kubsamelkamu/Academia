import { expect, test } from "@playwright/test"

const coordinatorRoutes = [
  "/dashboard/coordinator",
  "/dashboard/coordinator/evaluator-progress",
  "/dashboard/coordinator/notify-advisors",
  "/dashboard/coordinator/notify-evaluators",
  "/dashboard/coordinator/advisor-progress",
  "/dashboard/coordinator/grade-management",
  "/dashboard/coordinator/reports",
  "/dashboard/coordinator/projects",
  "/dashboard/coordinator/groups",
  "/dashboard/coordinator/groups/applications",
  "/dashboard/coordinator/complaints",
]

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
] as const

const useDevCoordinatorLogin = process.env.PLAYWRIGHT_USE_DEV_COORDINATOR_LOGIN === "1"

function slugifyRoute(route: string) {
  return route.replace(/^\/+/, "").replace(/[\\/]/g, "-")
}

for (const viewport of viewports) {
  test.describe(`Coordinator responsive ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const route of coordinatorRoutes) {
      test(`${viewport.name} ${route}`, async ({ page }, testInfo) => {
        if (useDevCoordinatorLogin) {
          await page.goto("/dev/login-coordinator", { waitUntil: "networkidle" })
          await page.waitForURL("**/dashboard/coordinator", { timeout: 15_000 })
        }

        await page.goto(route, { waitUntil: "networkidle" })

        const pathAfterLoad = new URL(page.url()).pathname
        const fileSafeRoute = slugifyRoute(route)

        await page.screenshot({
          path: testInfo.outputPath(`${viewport.name}-${fileSafeRoute}.png`),
          fullPage: true,
        })

        if (pathAfterLoad.startsWith("/login")) {
          testInfo.annotations.push({
            type: "auth",
            description: `Route redirected to ${pathAfterLoad}. Log in first if you want full layout verification.`,
          })
          return
        }

        const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth)
        expect(pageWidth).toBeLessThanOrEqual(viewport.width + 1)

        await expect(page.locator("h1").first()).toBeVisible()
      })
    }
  })
}
