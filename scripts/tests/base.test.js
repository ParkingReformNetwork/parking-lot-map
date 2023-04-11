const fs = require("fs").promises;
const {
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} = require("@jest/globals");
const { determineArgs, updateCoordinates } = require("../base");

describe("determineArgs()", () => {
  test("returns the city name and ID", () => {
    const result = determineArgs("my-script", ["My City"]);
    expect(result.value).toEqual({
      cityName: "My City",
      cityId: "my-city",
    });
  });

  test("requires exactly 1 argument", () => {
    let result = determineArgs("my-script", []);
    expect(result.error).toContain("exactly one argument");

    result = determineArgs("my-script", ["My City", "--bad"]);
    expect(result.error).toContain("exactly one argument");

    result = determineArgs("my-script", ["My City", "AZ"]);
    expect(result.error).toContain("exactly one argument");
  });
});

describe("updateCoordinates()", () => {
  let originalData;
  const originalFilePath = "scripts/tests/data/original-data.geojson";
  const validUpdateFilePath = "scripts/tests/data/valid-update.geojson";

  beforeAll(async () => {
    // Save the original data for reverting the changes.
    originalData = await fs.readFile(originalFilePath, "utf8");
  });

  afterEach(async () => {
    // Revert the changes.
    await fs.writeFile(originalFilePath, originalData);
  });

  test("updates the coordinates for an existing city", async () => {
    const updateFilePath = validUpdateFilePath;

    const cityId = "shoup-ville-az";
    const result = await updateCoordinates(
      "my-script",
      cityId,
      false,
      originalFilePath,
      updateFilePath
    );
    expect(result.error).toBeUndefined();
    expect(result.value).toBeDefined();

    const rawUpdateData = await fs.readFile(updateFilePath, "utf8");
    const updateData = JSON.parse(rawUpdateData);
    const updatedCoordinates = updateData.features[0].geometry.coordinates;

    const rawResultData = await fs.readFile(originalFilePath, "utf8");
    const resultData = JSON.parse(rawResultData);

    const cityTargetData = resultData.features.find(
      (feature) => feature.properties.id === cityId
    );
    expect(cityTargetData.geometry.coordinates).toEqual(updatedCoordinates);
  });

  test("adds a new city when add is set", async () => {
    const updateFilePath = validUpdateFilePath;

    const cityId = "parking-reform-now";
    const result = await updateCoordinates(
      "my-script",
      cityId,
      true,
      originalFilePath,
      updateFilePath
    );
    expect(result.error).toBeUndefined();
    expect(result.value).toBeDefined();

    const rawUpdatedData = await fs.readFile(updateFilePath, "utf8");
    const updatedData = JSON.parse(rawUpdatedData);
    const updatedCoordinates = updatedData.features[0].geometry.coordinates;

    const rawResultData = await fs.readFile(originalFilePath, "utf8");
    const resultData = JSON.parse(rawResultData);

    const resultCityIds = resultData.features.map(
      (feature) => feature.properties.id
    );
    expect(resultCityIds).toEqual(["honolulu-hi", cityId, "shoup-ville-az"]);

    const cityTargetData = resultData.features.find(
      (feature) => feature.properties.id === cityId
    );
    expect(cityTargetData.properties).toEqual({
      id: cityId,
    });
    expect(cityTargetData.geometry.type).toEqual("MultiPolygon");
    expect(cityTargetData.geometry.coordinates).toEqual(updatedCoordinates);
  });

  test("errors if city cannot be found in the original data and add not set", async () => {
    const result = await updateCoordinates(
      "my-script",
      "bad-city",
      false,
      originalFilePath,
      validUpdateFilePath
    );
    expect(result.error).toContain("To add a new city,");
  });

  test("validates the update file has exactly one `feature`", async () => {
    let result = await updateCoordinates(
      "my-script",
      "shoup-ville-az",
      false,
      originalFilePath,
      "scripts/tests/data/too-many-updates.geojson"
    );
    expect(result.error).toContain("expects exactly one entry in `features`");

    result = await updateCoordinates(
      "my-script",
      "shoup-ville-az",
      false,
      originalFilePath,
      "scripts/tests/data/empty-update.geojson"
    );
    expect(result.error).toContain("expects exactly one entry in `features`");
  });

  test("errors gracefully if update file not found", async () => {
    const result = await updateCoordinates(
      "my-script",
      "shoup-ville-az",
      false,
      originalFilePath,
      "scripts/tests/data/does-not-exist"
    );
    expect(result.error).toContain("scripts/tests/data/does-not-exist");
  });

  test("errors gracefully if original data file not found", async () => {
    const result = await updateCoordinates(
      "my-script",
      "shoup-ville-az",
      false,
      "scripts/tests/data/does-not-exist",
      validUpdateFilePath
    );
    expect(result.error).toContain("scripts/tests/data/does-not-exist");
  });
});
