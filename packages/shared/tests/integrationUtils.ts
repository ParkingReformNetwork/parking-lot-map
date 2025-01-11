import fs from "fs/promises";

import type { Page } from "@playwright/test";
import {
  BaseCityStats,
  CityId,
  CityStatsCollection,
} from "../src/js/model/types";

export async function loadMap(page: Page, anchor?: string): Promise<void> {
  await page.goto(anchor ?? "");
  await page.waitForSelector(".choices");
}

export async function readCityStats<T extends BaseCityStats>(): Promise<
  CityStatsCollection<T>
> {
  const raw = await fs.readFile("data/city-stats.json");
  return JSON.parse(raw.toString()) as CityStatsCollection<T>;
}

export async function getAllDropdownValues(page: Page): Promise<string[]> {
  const result = await page.$$eval(".choices__item--choice", (elements) =>
    Array.from(elements.map((opt) => opt.textContent?.trim() ?? "")),
  );
  result.sort();
  return result;
}

export async function getCurrentCity(
  page: Page,
): Promise<{ scorecardTitle: string; cityId: CityId }> {
  const [scorecardTitle, cityId] = await page.evaluate(() => {
    const title = document.querySelector(".scorecard-title")!.textContent!;
    const cityToggle = (
      document.querySelector("#city-dropdown") as HTMLSelectElement
    ).value;
    return [title, cityToggle];
  });
  return { scorecardTitle, cityId };
}
