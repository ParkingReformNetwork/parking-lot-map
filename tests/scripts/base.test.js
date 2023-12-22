import fs from "fs/promises";
import { expect, test } from "@playwright/test";
import {
  determineArgs,
  updateCoordinates,
  updateParkingLots,
} from "../../scripts/base";

test.describe("determineArgs()", () => {
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

test.describe("updateCoordinates()", () => {
  let originalData;
  const originalFilePath = "tests/scripts/data/original-data.geojson";
  const validUpdateFilePath = "tests/scripts/data/valid-update.geojson";

  test.beforeAll(async () => {
    // Save the original data for reverting the changes.
    originalData = await fs.readFile(originalFilePath, "utf8");
  });

  test.afterEach(async () => {
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
      "tests/scripts/data/too-many-updates.geojson"
    );
    expect(result.error).toContain("expects exactly one entry in `features`");

    result = await updateCoordinates(
      "my-script",
      "shoup-ville-az",
      false,
      originalFilePath,
      "tests/scripts/data/empty-update.geojson"
    );
    expect(result.error).toContain("expects exactly one entry in `features`");
  });

  test("errors gracefully if update file not found", async () => {
    const result = await updateCoordinates(
      "my-script",
      "shoup-ville-az",
      false,
      originalFilePath,
      "tests/scripts/data/does-not-exist"
    );
    expect(result.error).toContain("tests/scripts/data/does-not-exist");
  });

  test("errors gracefully if original data file not found", async () => {
    const result = await updateCoordinates(
      "my-script",
      "shoup-ville-az",
      false,
      "tests/scripts/data/does-not-exist",
      validUpdateFilePath
    );
    expect(result.error).toContain("tests/scripts/data/does-not-exist");
  });
});

test.describe("updateParkingLots()", () => {
  let originalData;
  const parkingLotData = "tests/scripts/data/parking-lot-data.geojson";
  const addDataPath = "tests/scripts/data/new-parking-lot.geojson";

  test.beforeAll(async () => {
    // Save the original data for reverting the changes.
    originalData = await fs.readFile(parkingLotData, "utf8");
  });

  test.afterEach(async () => {
    // Revert the changes.
    await fs.writeFile(parkingLotData, originalData);
  });

  const expectUpdatedFile = async (cityId, updateFilePath) => {
    const rawUpdatedData = await fs.readFile(updateFilePath, "utf8");
    const updatedData = JSON.parse(rawUpdatedData);
    const updatedCoordinates = updatedData.geometry.coordinates;

    const parsedOriginalData = JSON.parse(originalData);

    expect(updatedData.properties).toEqual({
      id: cityId,
    });
    expect(updatedData.geometry.type).toEqual("MultiPolygon");
    expect(parsedOriginalData.features[0].geometry.coordinates).toEqual(
      updatedCoordinates
    );
  };

  test("adds a new city", async () => {
    const cityId = "parking-reform-now";
    const result = await updateParkingLots(
      cityId,
      true,
      parkingLotData,
      addDataPath
    );
    expect(result.error).toBeUndefined();
    expect(result.value).toBeDefined();

    await expectUpdatedFile(cityId, addDataPath);

    await fs.rm(addDataPath);
  });
  test("update city lots", async () => {
    const existingDataPath = "tests/scripts/data/existing-lot-data.geojson";
    const existingData = await fs.readFile(existingDataPath);

    const cityId = "parking-reform-now";
    const result = await updateParkingLots(
      cityId,
      true,
      parkingLotData,
      existingDataPath
    );
    expect(result.error).toBeUndefined();
    expect(result.value).toBeDefined();

    await expectUpdatedFile(cityId, existingDataPath);
    await fs.writeFile(existingDataPath, existingData);
  });
});
