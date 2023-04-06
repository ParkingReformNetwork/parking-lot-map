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
  test("detects whether --add is set", () => {
    let result = determineArgs("my-script", ["My City"]);
    expect(result.value).toEqual({ cityName: "My City", addFlag: false });

    result = determineArgs("my-script", ["My City", "--add"]);
    expect(result.value).toEqual({ cityName: "My City", addFlag: true });

    result = determineArgs("my-script", ["--add", "My City"]);
    expect(result.value).toEqual({ cityName: "My City", addFlag: true });
  });

  test("requires the city to be specified", () => {
    let result = determineArgs("my-script", []);
    expect(result.error).toContain("provide a city/state name");

    result = determineArgs("my-script", ["--add"]);
    expect(result.error).toContain("provide a city/state name");
  });

  test("errors if unrecognized arguments", () => {
    let result = determineArgs("my-script", ["My City", "--bad"]);
    expect(result.error).toContain("Unexpected arguments");

    result = determineArgs("my-script", ["My City", "--add", "bad"]);
    expect(result.error).toContain("Unexpected arguments");
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

    const cityName = "Shoup Ville, AZ";
    const result = await updateCoordinates(
      "my-script",
      cityName,
      false,
      "Polygon",
      {},
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
      (feature) => feature.properties.Name === cityName
    );
    expect(cityTargetData.geometry.coordinates).toEqual(updatedCoordinates);
  });

  test("adds a new city when `--add` used", async () => {
    const updateFilePath = validUpdateFilePath;

    const cityName = "Parking Reform Now, NY";
    const result = await updateCoordinates(
      "my-script",
      cityName,
      true,
      "MyShape",
      { MyProperty: "Fill me in" },
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

    const cityTargetData = resultData.features.find(
      (feature) => feature.properties.Name === cityName
    );
    expect(cityTargetData.properties).toEqual({
      Name: cityName,
      MyProperty: "Fill me in",
    });
    expect(cityTargetData.geometry.type).toEqual("MyShape");
    expect(cityTargetData.geometry.coordinates).toEqual(updatedCoordinates);
  });

  test("errors if city cannot be found in the original data and `--add` not set", async () => {
    const result = await updateCoordinates(
      "my-script",
      "Bad City",
      false,
      "Polygon",
      {},
      originalFilePath,
      validUpdateFilePath
    );
    expect(result.error).toContain("To add a new city,");
  });

  test("validates the update file has exactly one `feature`", async () => {
    let result = await updateCoordinates(
      "my-script",
      "Shoup Ville, AZ",
      false,
      "Polygon",
      {},
      originalFilePath,
      "scripts/tests/data/too-many-updates.geojson"
    );
    expect(result.error).toContain("expects exactly one entry in `features`");

    result = await updateCoordinates(
      "my-script",
      "Shoup Ville, AZ",
      false,
      "Polygon",
      {},
      originalFilePath,
      "scripts/tests/data/empty-update.geojson"
    );
    expect(result.error).toContain("expects exactly one entry in `features`");
  });

  test("errors gracefully if update file not found", async () => {
    const result = await updateCoordinates(
      "my-script",
      "Shoup Ville, AZ",
      false,
      "Polygon",
      {},
      originalFilePath,
      "scripts/tests/data/does-not-exist"
    );
    expect(result.error).toContain("scripts/tests/data/does-not-exist");
  });

  test("errors gracefully if original data file not found", async () => {
    const result = await updateCoordinates(
      "my-script",
      "Shoup Ville, AZ",
      false,
      "Polygon",
      {},
      "scripts/tests/data/does-not-exist",
      validUpdateFilePath
    );
    expect(result.error).toContain("scripts/tests/data/does-not-exist");
  });
});
