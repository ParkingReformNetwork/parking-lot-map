import fs from "fs";
import { expect, test } from "@playwright/test";

test("every city is in the toggle", async ({ page }) => {
  const rawData: Buffer = fs.readFileSync("data/city-stats.json");
  const data: JSON = JSON.parse(rawData.toString());
  const expectedCities = Object.values(data).map((scoreCard) => scoreCard.name);

  await page.goto("/");
  await page.waitForSelector(".choices");

  const toggleValues = await page.$$eval(".choices__item--choice", (elements) =>
    Array.from(elements.map((opt) => opt.textContent?.trim())),
  );

  toggleValues.sort();
  expectedCities.sort();

  expect(toggleValues).toEqual(expectedCities);
});
