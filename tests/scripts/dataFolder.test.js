import fs from "fs/promises";
import { expect, test } from "@playwright/test";

const assertSortedGeojson = async (filePath) => {
  const rawData = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(rawData);
  const sortedFeatures = [...data.features].sort((a, b) =>
    a.properties.id.localeCompare(b.properties.id)
  );
  expect(data.features).toEqual(sortedFeatures);
};

test("cities-polygons.geojson features are sorted alphabetically", async () => {
  await assertSortedGeojson("data/city-boundaries.geojson");
});

test("score-cards.json is sorted alphabetically", async () => {
  const rawData = await fs.readFile("data/score-cards.json", "utf8");
  const data = JSON.parse(rawData);
  const sortedKeys = Object.keys(data).sort();
  expect(Object.keys(data)).toEqual(sortedKeys);
});
