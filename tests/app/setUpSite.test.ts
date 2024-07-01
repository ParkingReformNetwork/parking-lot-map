/* global document, navigator */
import fs from "fs";
import { expect, test, Page } from "@playwright/test";

test("no console errors and warnings", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warn") {
      errors.push(message.text());
    }
  });

  await page.goto("");
  expect(errors).toHaveLength(0);
});

test("every city is in the toggle", async ({ page }) => {
  const rawData: Buffer = fs.readFileSync("data/score-cards.json");
  const data: JSON = JSON.parse(rawData.toString());
  const expectedCities = Object.values(data).map((scoreCard) => scoreCard.name);

  await page.goto("/");
  await page.waitForSelector(".choices");

  const toggleValues = await page.$$eval(".choices__item--choice", (elements) =>
    Array.from(elements.map((opt) => opt.textContent?.trim()))
  );

  toggleValues.sort();
  expectedCities.sort();

  expect(toggleValues).toEqual(expectedCities);
});

test("correctly load the city score card", async ({ page }) => {
  const rawData: Buffer = fs.readFileSync("data/score-cards.json");
  const albanyExpected = JSON.parse(rawData.toString())["albany-ny"];
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
    const titleElement = document.querySelector(
      ".leaflet-popup-content .title"
    );
    return titleElement && titleElement.textContent === "Albany, NY";
  });

  const [content, cityToggleValue] = await page.evaluate(() => {
    const cityChoice: HTMLSelectElement | null =
      document.querySelector("#city-dropdown");
    const cityToggle = cityChoice?.value;

    const detailsTitles = Array.from(
      document.querySelectorAll(".leaflet-popup-content .details-title")
    ).map((el) => el.textContent);
    const detailsValues = Array.from(
      document.querySelectorAll(".leaflet-popup-content .details-value")
    ).map((el) => el.textContent);

    const details: Record<string, string | null> = {};
    detailsTitles.forEach((title, index) => {
      if (title) {
        details[title] = detailsValues[index];
      }
    });
    return [details, cityToggle];
  });
  expect(cityToggleValue).toEqual("albany-ny");
  expect(content["Parking: "]).toEqual(
    `${albanyExpected.percentage} of central city`
  );
  expect(content["Population: "]).toEqual(albanyExpected.population);
  expect(content["Urbanized area population: "]).toEqual(
    albanyExpected.urbanizedAreaPopulation
  );
  expect(content["Parking score: "]).toEqual(albanyExpected.parkingScore);
  expect(content["Parking reform: "]).toEqual(albanyExpected.reforms);
  expect(albanyLoaded).toBe(true);
});

test.describe("the share feature", () => {
  test("share button writes the URL to the clipboard", async ({ browser }) => {
    const context = await browser.newContext();
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForSelector(".url-copy-button > a");

    await page.click(".url-copy-button > a");
    const firstCityClipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(firstCityClipboardText).toContain("/#parking-reform-map=atlanta-ga");

    // Check that the share button works when changing the city, too.
    // This is a regression test.
    await page.waitForSelector(".choices");
    await page.click(".choices");
    await page.click('.choices__item--choice >> text="Anchorage, AK"');
    await page.waitForFunction(() => {
      const titleElement = document.querySelector(
        ".leaflet-popup-content .title"
      );
      return titleElement && titleElement.textContent === "Anchorage, AK";
    });

    await page.click(".url-copy-button > a");
    const secondCityClipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(secondCityClipboardText).toContain(
      "/#parking-reform-map=anchorage-ak"
    );
  });

  test("loading from a share link works", async ({ page }) => {
    // Regression test of https://github.com/ParkingReformNetwork/parking-lot-map/issues/10.
    await page.goto("#parking-reform-map=fort-worth-tx");

    // Wait a second to make sure the site is fully loaded.
    await page.waitForSelector(".leaflet-popup-content .title");

    const [scoreCardTitle, cityToggleValue] = await page.evaluate(() => {
      const titlePopup: HTMLElement | null = document.querySelector(
        ".leaflet-popup-content .title"
      );
      const title = titlePopup?.textContent;
      const cityChoice: HTMLSelectElement | null =
        document.querySelector("#city-dropdown");
      const cityToggle = cityChoice?.value;
      return [title, cityToggle];
    });

    expect(scoreCardTitle).toEqual("Fort Worth, TX");
    expect(cityToggleValue).toEqual("fort-worth-tx");
  });

  test("loading from a bad share link falls back to default city", async ({
    page,
  }) => {
    await page.goto("#parking-reform-map=bad-city");

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);
    const [scoreCardTitle, cityToggleValue] = await page.evaluate(() => {
      const titlePopup: HTMLAnchorElement | null = document.querySelector(
        ".leaflet-popup-content .title"
      );

      const title = titlePopup?.textContent;
      const cityChoiceSelector: HTMLSelectElement | null =
        document.querySelector("#city-dropdown");
      const cityToggle = cityChoiceSelector?.value;
      return [title, cityToggle];
    });

    expect(scoreCardTitle).toEqual("Atlanta, GA");
    expect(cityToggleValue).toEqual("atlanta-ga");
  });
});

const dragMap = async (page: Page, distance: number) => {
  await page.waitForTimeout(1000);
  await page.mouse.move(600, 500);
  await page.mouse.down();
  await page.mouse.move(600 + distance, 500, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(2000);
};

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

    const newScorecard = await page
      .locator(".leaflet-popup-content .title")
      .evaluate((node) => node.textContent);
    expect(newScorecard).toEqual("Birmingham, AL");
    expect(await page.isVisible("#birmingham-al")).toBe(true);
  });
  test("clicking on city boundary wide view", async ({ page }) => {
    await page.goto("");

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);

    // Zoom out.
    await page
      .locator(".leaflet-control-zoom-out")
      .click({ clickCount: 10, delay: 300 });
    // Click on Birmingham boundary.
    const city = await page.locator("#birmingham-al");
    await city.click({ force: true });

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);

    const scorecard = await page
      .locator(".leaflet-popup-content .title")
      .evaluate((node) => node.textContent);
    expect(scorecard).toEqual("Atlanta, GA");
  });
});

test("scorecard pulls up city closest to center", async ({ page }) => {
  await page.goto("");

  await page.waitForSelector(".leaflet-control-zoom-out");

  // Zoom out.
  await page
    .locator(".leaflet-control-zoom-out")
    .click({ clickCount: 6, delay: 300 });

  // Drag map to Birmingham
  await dragMap(page, 300);

  await page.waitForSelector(".choices");
  const [scoreCardTitle, cityToggleValue] = await page.evaluate(() => {
    const titlePopup = document.querySelector(".leaflet-popup-content .title");
    const title = titlePopup?.textContent;
    const cityChoice: HTMLSelectElement | null =
      document.querySelector("#city-dropdown");
    return [title, cityChoice?.value];
  });
  expect(scoreCardTitle).toEqual("Birmingham, AL");
  expect(cityToggleValue).toEqual("birmingham-al");
});

test("map only loads parking lots for visible cities", async ({ page }) => {
  await page.goto("");

  let birminghamLoaded = false;
  page.route("**/*", (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.includes("birmingham-al")) {
      birminghamLoaded = true;
    }
    route.continue();
  });

  // Wait a second to make sure the site is fully loaded.
  await page.waitForTimeout(1000);

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
