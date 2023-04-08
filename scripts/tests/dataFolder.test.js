const fs = require("fs").promises;
const { expect, test } = require("@jest/globals");

const assertSorted = async (filePath) => {
  const rawData = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(rawData);
  const sortedFeatures = [...data.features].sort((a, b) =>
    a.properties.id.localeCompare(b.properties.id)
  );
  expect(data.features).toEqual(sortedFeatures);
};

test("cities-polygons.geojson features are sorted alphabetically", async () => {
  await assertSorted("data/cities-polygons.geojson");
});

test("parking-lots.geojson features are sorted alphabetically", async () => {
  await assertSorted("data/parking-lots.geojson");
});
