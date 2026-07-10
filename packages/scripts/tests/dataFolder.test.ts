import fs from "node:fs/promises";
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

async function assertKeysAgree(dataDir: string): Promise<void> {
  const stats = JSON.parse(
    await fs.readFile(`${dataDir}/city-stats.json`, "utf8"),
  );
  const statsKeys = Object.keys(stats).sort();

  const boundaries = JSON.parse(
    await fs.readFile(`${dataDir}/city-boundaries.geojson`, "utf8"),
  );
  const boundaryIds = boundaries.features
    .map((feature: { properties: { id: string } }) => feature.properties.id)
    .sort();

  const parkingLotFiles = (await fs.readdir(`${dataDir}/parking-lots`))
    .map((fileName) => fileName.replace(/\.geojson$/, ""))
    .sort();

  expect(boundaryIds).toEqual(statsKeys);
  expect(parkingLotFiles).toEqual(statsKeys);
}

test("city-stats.json, city-boundaries.geojson, and parking-lots/ agree on city IDs", async () => {
  await assertKeysAgree("../ct/data");
  await assertKeysAgree("../primary/data");
});
