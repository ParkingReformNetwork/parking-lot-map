const fs = require("fs").promises;
const {
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} = require("@jest/globals");
const { determineArgs, updateGeoJSON } = require("../update-lots");

describe("determineArgs()", () => {
  test("detects whether --add is set", () => {
    let result = determineArgs(["My City"]);
    expect(result.value).toEqual({ cityName: "My City", addFlag: false });

    result = determineArgs(["My City", "--add"]);
    expect(result.value).toEqual({ cityName: "My City", addFlag: true });

    result = determineArgs(["--add", "My City"]);
    expect(result.value).toEqual({ cityName: "My City", addFlag: true });
  });

  test("requires the city to be specified", () => {
    let result = determineArgs([]);
    expect(result.error).toContain("provide a city/state name");

    result = determineArgs(["--add"]);
    expect(result.error).toContain("provide a city/state name");
  });

  test("errors if unrecognized arguments", () => {
    let result = determineArgs(["My City", "--bad"]);
    expect(result.error).toContain("Unexpected arguments");

    result = determineArgs(["My City", "--add", "bad"]);
    expect(result.error).toContain("Unexpected arguments");
  });
});

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

  test("updates the coordinates for an existing city", async () => {
    const updateFilePath = validUpdateFilePath;

    const cityName = "Shoup Ville, AZ";
    const result = await updateGeoJSON(
      cityName,
      false,
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

  test("adds a new city when `--add` used", async () => {
    const updateFilePath = validUpdateFilePath;

    const cityName = "Parking Reform Now, NY";
    const result = await updateGeoJSON(
      cityName,
      true,
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

  test("errors if city cannot be found in the original data and `--add` not set", async () => {
    const result = await updateGeoJSON(
      "Bad City",
      false,
      originalFilePath,
      validUpdateFilePath
    );
    expect(result.error).toContain("To add a new city,");
  });

  test("validates the update file has exactly one `feature`", async () => {
    let result = await updateGeoJSON(
      "Shoup Ville, AZ",
      false,
      originalFilePath,
      "scripts/tests/data/parking-lots/too-many-updates.geojson"
    );
    expect(result.error).toContain("expects exactly one entry in `features`");

    result = await updateGeoJSON(
      "Shoup Ville, AZ",
      false,
      originalFilePath,
      "scripts/tests/data/parking-lots/empty-update.geojson"
    );
    expect(result.error).toContain("expects exactly one entry in `features`");
  });

  test("errors gracefully if update file not found", async () => {
    const result = await updateGeoJSON(
      "Shoup Ville, AZ",
      false,
      originalFilePath,
      "scripts/tests/data/does-not-exist"
    );
    expect(result.error).toContain("scripts/tests/data/does-not-exist");
  });

  test("errors gracefully if original data file not found", async () => {
    const result = await updateGeoJSON(
      "Shoup Ville, AZ",
      false,
      "scripts/tests/data/does-not-exist",
      validUpdateFilePath
    );
    expect(result.error).toContain("scripts/tests/data/does-not-exist");
  });
});
