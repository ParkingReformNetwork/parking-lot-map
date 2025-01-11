import fs from "fs/promises";

import { expect, test } from "@playwright/test";

async function assertSortedGeojson(filePath: string): Promise<void> {
  const rawData = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(rawData);
  const sortedFeatures = [...data.features].sort((a, b) =>
    a.properties.id.localeCompare(b.properties.id),
  );
  expect(data.features).toEqual(sortedFeatures);
}

async function assertSortedStats(filePath: string): Promise<void> {
  const rawData = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(rawData);
  const sortedKeys = Object.keys(data).sort();
  expect(Object.keys(data)).toEqual(sortedKeys);
}

test("cities-polygons.geojson features are sorted alphabetically", async () => {
  await assertSortedGeojson("../ct/data/city-boundaries.geojson");
  await assertSortedGeojson("../primary/data/city-boundaries.geojson");
});

test("city-stats.json is sorted alphabetically", async () => {
  await assertSortedStats("../ct/data/city-stats.json");
  await assertSortedStats("../primary/data/city-stats.json");
});
