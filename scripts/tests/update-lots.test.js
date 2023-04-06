const fs = require("fs").promises;
const {
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} = require("@jest/globals");
const updateGeoJSON = require("../update-lots");

describe("updateGeoJSON()", () => {
  let originalData;
  const originalFilePath =
    "scripts/tests/data/parking-lots/original-data.geojson";
  const validUpdateFilePath =
    "scripts/tests/data/parking-lots/valid-update.geojson";

  beforeAll(async () => {
    // Save the original data for reverting the changes.
    originalData = await fs.readFile(originalFilePath, "utf8");
  });

  afterEach(async () => {
    // Revert the changes.
    await fs.writeFile(originalFilePath, originalData);
  });

  test("saves the new coordinates", async () => {
    const updateFilePath = validUpdateFilePath;

    const cityName = "Shoup Ville, AZ";
    const result = await updateGeoJSON(
      cityName,
      originalFilePath,
      updateFilePath
    );
    expect(result.error).toBeUndefined();
    expect(result.value).toBeDefined();

    const rawUpdateData = await fs.readFile(updateFilePath, "utf8");
    const updateData = JSON.parse(rawUpdateData);
    const updateCoordinates = updateData.features[0].geometry.coordinates;

    const rawResultData = await fs.readFile(originalFilePath, "utf8");
    const resultData = JSON.parse(rawResultData);

    const cityTargetData = resultData.features.find(
      (feature) => feature.properties.Name === cityName
    );
    expect(cityTargetData.geometry.coordinates).toEqual(updateCoordinates);
  });

  test("requires the city to be specified", async () => {
    const result = await updateGeoJSON(
      undefined,
      originalFilePath,
      validUpdateFilePath
    );
    expect(result.error).toContain("provide a city/state name as an argument");
  });

  test("errors if city cannot be found in the original data", async () => {
    const result = await updateGeoJSON(
      "Bad City",
      originalFilePath,
      validUpdateFilePath
    );
    expect(result.error).toContain(
      "only works on cities currently in the data set"
    );
  });

  test("validates the update file has exactly one `feature`", async () => {
    let result = await updateGeoJSON(
      "Shoup Ville, AZ",
      originalFilePath,
      "scripts/tests/data/parking-lots/too-many-updates.geojson"
    );
    expect(result.error).toContain("expects exactly one entry in `features`");

    result = await updateGeoJSON(
      "Shoup Ville, AZ",
      originalFilePath,
      "scripts/tests/data/parking-lots/empty-update.geojson"
    );
    expect(result.error).toContain("expects exactly one entry in `features`");
  });

  test("errors gracefully if update file not found", async () => {
    const result = await updateGeoJSON(
      "Shoup Ville, AZ",
      originalFilePath,
      "scripts/tests/data/does-not-exist"
    );
    expect(result.error).toContain("scripts/tests/data/does-not-exist");
  });

  test("errors gracefully if original data file not found", async () => {
    const result = await updateGeoJSON(
      "Shoup Ville, AZ",
      "scripts/tests/data/does-not-exist",
      validUpdateFilePath
    );
    expect(result.error).toContain("scripts/tests/data/does-not-exist");
  });
});
