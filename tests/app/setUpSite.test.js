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
  const anchorageExpected = JSON.parse(rawData)["anchorage-ak"];

  await page.goto("");

  const selectElement = await page.$("#city-choice");
  await selectElement.selectOption("anchorage-ak");
  await page.waitForFunction(() => {
    const titleElement = document.querySelector(
      ".leaflet-popup-content .title"
    );
    return titleElement && titleElement.textContent === "Anchorage, AK";
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

  expect(cityToggleValue).toEqual("anchorage-ak");
  expect(content["Parking: "]).toEqual(
    `${anchorageExpected.Percentage} of central city`
  );
  expect(content["Population: "]).toEqual(anchorageExpected.Population);
  expect(content["Metro population: "]).toEqual(
    anchorageExpected["Metro Population"]
  );
  expect(content["Parking score: "]).toEqual(
    anchorageExpected["Parking Score"]
  );
  expect(content["Parking reform: "]).toEqual(anchorageExpected.Reforms);
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
