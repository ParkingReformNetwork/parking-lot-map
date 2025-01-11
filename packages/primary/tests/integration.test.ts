import { expect, test, Page } from "@playwright/test";

import {
  getAllDropdownValues,
  getCurrentCity,
  loadMap,
  readCityStats,
} from "@prn-parking-lots/shared/tests/integrationUtils.ts";

import type { CityStats } from "../src/js/types";

test("every city is in the toggle", async ({ page }) => {
  const cityStats = await readCityStats();
  const expectedCities = Object.values(cityStats).map(({ name }) => name);
  await loadMap(page);
  const dropdownValues = await getAllDropdownValues(page);
  expect(dropdownValues).toEqual(expectedCities);
});

test("correctly load the city score card", async ({ page }) => {
  let albanyLoaded = false;
  page.route("**/*", (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.includes("albany-ny")) {
      albanyLoaded = true;
    }
    route.continue();
  });

  await page.goto("/");
  expect(albanyLoaded).toBe(false);
  await page.waitForSelector(".choices");

  await page.click(".choices");
  await page.click('.choices__item--choice >> text="Albany, NY"');
  await page.waitForFunction(() => {
    const titleElement = document.querySelector(".scorecard-title");
    return (
      titleElement && titleElement.textContent === "Parking lots in Albany, NY"
    );
  });

  await page.locator(".scorecard-accordion-toggle").click();

  const [contentLines, cityToggleValue] = await page.evaluate(async () => {
    const cityChoice: HTMLSelectElement | null =
      document.querySelector("#city-dropdown");
    const cityToggleValue2 = cityChoice?.value;

    const lines = Array.from(
      document.querySelectorAll(
        ".scorecard-container p, .scorecard-container li",
      ),
    )
      .filter(
        (el) =>
          el instanceof HTMLParagraphElement || el instanceof HTMLLIElement,
      )
      .map((p) => p.textContent?.trim() || "");
    return [lines, cityToggleValue2];
  });

  expect(albanyLoaded).toBe(true);
  expect(cityToggleValue).toEqual("albany-ny");

  const cityStats = await readCityStats<CityStats>();
  const albanyExpected = cityStats["albany-ny"];
  const expectedLines = new Set([
    `${albanyExpected.percentage} of the central city is off-street parking`,
    `${albanyExpected.parkingScore}/100 parking score (lower is better)`,
    `City type: ${albanyExpected.cityType}`,
    `${albanyExpected.population} city residents`,
    `${albanyExpected.urbanizedAreaPopulation} urbanized area residents`,
    `Parking reforms ${albanyExpected.reforms} (details )`,
  ]);
  expect(new Set(contentLines)).toEqual(expectedLines);
});

test.describe("the share feature", () => {
  test("share button writes the URL to the clipboard", async ({ browser }) => {
    const context = await browser.newContext();
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const page = await context.newPage();
    await loadMap(page);

    await page.click(".header-share-icon-container");
    const firstCityClipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(firstCityClipboardText).toContain("/#city=atlanta-ga");

    // Check that the share button works when changing the city, too.
    // This is a regression test.
    await page.waitForSelector(".choices");
    await page.click(".choices");
    await page.click('.choices__item--choice >> text="Anchorage, AK"');
    await page.waitForFunction(() => {
      const titleElement = document.querySelector(".scorecard-title");
      return (
        titleElement &&
        titleElement.textContent === "Parking lots in Anchorage, AK"
      );
    });

    await page.click(".header-share-icon-container");
    const secondCityClipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(secondCityClipboardText).toContain("/#city=anchorage-ak");

    // Also ensure the full-screen icon link is updated.
    const href = await page
      .locator(".header-full-screen-icon-container")
      .getAttribute("href");
    expect(href).toContain("/#city=anchorage-ak");
  });

  test("loading from a share link works", async ({ page }) => {
    // Regression test of https://github.com/ParkingReformNetwork/parking-lot-map/issues/10.
    await loadMap(page, "#city=fort-worth-tx");
    const { scorecardTitle, cityId } = await getCurrentCity(page);
    expect(scorecardTitle).toEqual("Parking lots in Fort Worth, TX");
    expect(cityId).toEqual("fort-worth-tx");
  });

  test("loading from a bad share link falls back to default city", async ({
    page,
  }) => {
    await loadMap(page, "#city=bad-city");
    const { scorecardTitle, cityId } = await getCurrentCity(page);
    expect(scorecardTitle).toEqual("Parking lots in Atlanta, GA");
    expect(cityId).toEqual("atlanta-ga");
  });
});

async function dragMap(page: Page, distance: number): Promise<void> {
  await page.waitForTimeout(1000);
  await page.mouse.move(600, 500);
  await page.mouse.down();
  await page.mouse.move(600 + distance, 500, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(2000);
}

test.describe("auto-focus city", () => {
  test("clicking on city boundary close view", async ({ page }) => {
    await page.goto("");

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);

    // Use this code to check map zoom value
    // const scaleValue = await page.$eval('.leaflet-proxy', (leafletProxy) => {
    //   const styleAttribute = leafletProxy.getAttribute('style');
    //   const scaleMatch = styleAttribute.match(/scale\((.*?)\)/); // Use regex to extract the scale value
    //   return scaleMatch ? parseFloat(scaleMatch[1]) : null;
    // });
    // console.log("Map Zoom before: " +(Math.log2(scaleValue)+1));

    // Zoom out.
    await page
      .locator(".leaflet-control-zoom-out")
      .click({ clickCount: 6, delay: 300 });

    // Drag map to bring Birmingham into view.
    await dragMap(page, 200);
    // Click on Birmingham boundary.
    const city = page.locator("#birmingham-al");
    await city.click({ force: true });

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);

    const { scorecardTitle } = await getCurrentCity(page);
    expect(scorecardTitle).toEqual("Parking lots in Birmingham, AL");
    expect(await page.locator("#birmingham-al").isVisible()).toBe(true);
  });

  test("clicking on city boundary doesn't impact zoom out", async ({
    page,
  }) => {
    await loadMap(page);

    // Zoom out.
    await page
      .locator(".leaflet-control-zoom-out")
      .click({ clickCount: 10, delay: 300 });

    // Click on Birmingham boundary.
    await page.locator("#birmingham-al").click({ force: true });

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);

    // Scorecard should stay the default of Atlanta
    const { scorecardTitle } = await getCurrentCity(page);
    expect(scorecardTitle).toEqual("Parking lots in Atlanta, GA");
  });
});

test("scorecard pulls up city closest to center", async ({ page }) => {
  await loadMap(page);

  // Zoom out.
  await page
    .locator(".leaflet-control-zoom-out")
    .click({ clickCount: 6, delay: 300 });

  // Drag map to Birmingham
  await dragMap(page, 300);

  await page.waitForSelector(".choices");
  const { scorecardTitle, cityId } = await getCurrentCity(page);
  expect(scorecardTitle).toEqual("Parking lots in Birmingham, AL");
  expect(cityId).toEqual("birmingham-al");
});

test("map only loads parking lots for visible cities", async ({ page }) => {
  let birminghamLoaded = false;
  page.route("**/*", (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.includes("birmingham-al")) {
      birminghamLoaded = true;
    }
    route.continue();
  });

  await loadMap(page);

  // Zoom out.
  await page
    .locator(".leaflet-control-zoom-out")
    .click({ clickCount: 6, delay: 300 });

  // Check that Birmingham's parking lots are not loaded
  expect(birminghamLoaded).toBe(false);

  // Drag map to Birmingham
  await dragMap(page, 300);

  // Check that Birmingham's parking lots are not loaded
  expect(birminghamLoaded).toBe(true);
});
