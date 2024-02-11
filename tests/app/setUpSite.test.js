/* global document, navigator */
import fs from "fs";
import { expect, test } from "@playwright/test";

test("no console errors and warnings", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warn") {
      errors.push(message.text());
    }
  });

  await page.goto("");
  expect(errors).toHaveLength(0);
});

test("every city is in the toggle", async ({ page }) => {
  const rawData = fs.readFileSync("data/score-cards.json");
  const data = JSON.parse(rawData);
  const expectedCities = Object.values(data).map((scoreCard) => scoreCard.Name);

  await page.goto("");

  // Wait a second to make sure the site is fully loaded.
  await page.waitForTimeout(1000);

  const toggleValues = await page.evaluate(() => {
    const select = document.querySelector("#city-choice");
    return Array.from(select.querySelectorAll("option")).map((opt) =>
      opt.textContent.trim()
    );
  });

  expectedCities.sort();
  expect(toggleValues).toEqual(expectedCities);
});

test("correctly load the city score card", async ({ page }) => {
  const rawData = fs.readFileSync("data/score-cards.json");
  const albanyExpected = JSON.parse(rawData)["albany-ny"];
  let albanyLoaded = false;
  page.route("**/*", (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.includes("albany-ny")) {
      albanyLoaded = true;
    }
    route.continue();
  });

  await page.goto("");
  expect(albanyLoaded).toBe(false);

  const selectElement = await page.$("#city-choice");
  await selectElement.selectOption("albany-ny");
  await page.waitForFunction(() => {
    const titleElement = document.querySelector(
      ".leaflet-popup-content .title"
    );
    return titleElement && titleElement.textContent === "Albany, NY";
  });

  const [content, cityToggleValue] = await page.evaluate(() => {
    const cityToggle = document.querySelector("#city-choice").value;

    const detailsTitles = Array.from(
      document.querySelectorAll(".leaflet-popup-content .details-title")
    ).map((el) => el.textContent);
    const detailsValues = Array.from(
      document.querySelectorAll(".leaflet-popup-content .details-value")
    ).map((el) => el.textContent);

    const details = {};
    detailsTitles.forEach((title, index) => {
      details[title] = detailsValues[index];
    });
    return [details, cityToggle];
  });
  expect(cityToggleValue).toEqual("albany-ny");
  expect(content["Parking: "]).toEqual(
    `${albanyExpected.Percentage} of central city`
  );
  expect(content["Population: "]).toEqual(albanyExpected.Population);
  expect(content["Urbanized area population: "]).toEqual(
    albanyExpected.urbanizedAreaPopulation
  );
  expect(content["Parking score: "]).toEqual(albanyExpected["Parking Score"]);
  expect(content["Parking reform: "]).toEqual(albanyExpected.Reforms);
  expect(albanyLoaded).toBe(true);
});

test.describe("the share feature", () => {
  test("share button writes the URL to the clipboard", async ({ browser }) => {
    const context = await browser.newContext();
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const page = await context.newPage();
    await page.goto("");

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);

    await page.click(".url-copy-button > a");
    const firstCityClipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(firstCityClipboardText).toContain("/#parking-reform-map=atlanta-ga");

    // Check that the share button works when changing the city, too.
    // This is a regression test.
    const selectElement = await page.$("#city-choice");
    await selectElement.selectOption("anchorage-ak");
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
    await page.waitForTimeout(1000);

    const [scoreCardTitle, cityToggleValue] = await page.evaluate(() => {
      const title = document.querySelector(
        ".leaflet-popup-content .title"
      ).textContent;
      const cityToggle = document.querySelector("#city-choice").value;
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
      const title = document.querySelector(
        ".leaflet-popup-content .title"
      ).textContent;
      const cityToggle = document.querySelector("#city-choice").value;
      return [title, cityToggle];
    });

    expect(scoreCardTitle).toEqual("Atlanta, GA");
    expect(cityToggleValue).toEqual("atlanta-ga");
  });
});

const dragMap = async (page, distance) => {
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
    const city = await page.locator("#birmingham-al");
    await city.click({ force: true });

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);

    const newScorecard = await page
      .locator(".leaflet-popup-content .title")
      .evaluate((node) => node.textContent);
    await expect(newScorecard).toEqual("Birmingham, AL");
    await expect(city).toBeVisible();
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
    await expect(scorecard).toEqual("Atlanta, GA");
  });
});

test("scorecard pulls up city closest to center", async ({ page }) => {
  await page.goto("");

  // Wait a second to make sure the site is fully loaded.
  await page.waitForTimeout(1000);

  // Zoom out.
  await page
    .locator(".leaflet-control-zoom-out")
    .click({ clickCount: 6, delay: 300 });

  // Drag map to Birmingham
  await dragMap(page, 300);
  const [scoreCardTitle, cityToggleValue] = await page.evaluate(() => {
    const title = document.querySelector(
      ".leaflet-popup-content .title"
    ).textContent;
    const cityToggle = document.querySelector("#city-choice").value;
    return [title, cityToggle];
  });
  await expect(scoreCardTitle).toEqual("Birmingham, AL");
  await expect(cityToggleValue).toEqual("birmingham-al");
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
