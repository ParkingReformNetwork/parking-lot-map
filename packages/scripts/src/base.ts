import fs from "fs/promises";

import results from "ts-results";
import {
  FeatureCollection,
  GeoJsonProperties,
  Polygon,
  Feature,
} from "geojson";

import { parseCityIdFromJson } from "@prn-parking-lots/primary/src/js/cityId.ts";
import type { CityId } from "@prn-parking-lots/shared/src/js/types";

const determineArgs = (
  scriptCommand: string,
  processArgv: string[],
): results.Result<{ cityName: string; cityId: CityId }, string> => {
  if (processArgv.length !== 1) {
    return new results.Err(
      `Must provide exactly one argument (the city/state name). For example,
       npm run ${scriptCommand} -- 'Columbus, OH'
       `,
    );
  }
  const cityName = processArgv[0];
  const cityId = parseCityIdFromJson(cityName);
  return results.Ok({ cityName, cityId });
};

const updateCoordinates = async (
  scriptCommand: string,
  cityId: CityId,
  addCity: boolean,
  originalFilePath: string,
  updateFilePath: string,
): Promise<results.Result<string, string>> => {
  let newData: FeatureCollection<Polygon, GeoJsonProperties>;
  try {
    const rawNewData = await fs.readFile(updateFilePath, "utf8");
    newData = JSON.parse(rawNewData);
  } catch (err: unknown) {
    const { message } = err as Error;
    return results.Err(
      `Issue reading the update file path ${updateFilePath}: ${message}`,
    );
  }

  if (!Array.isArray(newData.features) || newData.features.length !== 1) {
    return results.Err(
      "The script expects exactly one entry in `features` because you can only update one city at a time.",
    );
  }

  const polygon = newData.features[0].geometry;
  const newCoordinates = polygon.coordinates;
  const newGeometryType = polygon.type;

  let originalData: FeatureCollection<Polygon, GeoJsonProperties>;
  try {
    const rawOriginalData = await fs.readFile(originalFilePath, "utf8");
    originalData = JSON.parse(rawOriginalData);
  } catch (err: unknown) {
    const { message } = err as Error;
    return results.Err(
      `Issue reading the original data file path ${originalFilePath}: ${message}`,
    );
  }

  if (addCity) {
    const newEntry = {
      type: "Feature",
      properties: { id: cityId },
      geometry: { type: newGeometryType, coordinates: newCoordinates },
    } as Feature<Polygon>;
    originalData.features.push(newEntry);
  } else {
    const cityOriginalData = originalData.features.find(
      (feature) => feature?.properties?.id === cityId,
    );
    if (!cityOriginalData) {
      return results.Err(
        `City not found in ${originalFilePath}. To add a new city, run again with the '--add' flag, e.g. npm run ${scriptCommand} -- 'My City, AZ' --add`,
      );
    }
    cityOriginalData.geometry.coordinates = newCoordinates;
  }

  // Make sure the data is still sorted.
  originalData.features.sort((a, b) => {
    if (a.properties?.id < b.properties?.id) {
      return -1;
    }
    if (a.properties?.id > b.properties?.id) {
      return 1;
    }
    return 0;
  });

  await fs.writeFile(originalFilePath, JSON.stringify(originalData, null, 2));
  return results.Ok("File updated successfully!");
};

const updateParkingLots = async (
  cityId: CityId,
  addCity: boolean,
  originalFilePath: string,
  updateFilePath: string,
): Promise<results.Result<string, string>> => {
  let newData;
  try {
    const rawNewData = await fs.readFile(originalFilePath, "utf8");
    newData = JSON.parse(rawNewData);
  } catch (err: unknown) {
    const { message } = err as Error;
    return results.Err(
      `Issue reading the update file path parking-lots-update.geojson: ${message}`,
    );
  }

  if (!Array.isArray(newData.features) || newData.features.length !== 1) {
    return results.Err(
      "The script expects exactly one entry in `features` because you can only update one city at a time.",
    );
  }

  const newCoordinates = newData.features[0].geometry.coordinates;
  const newGeometryType = newData.features[0].geometry.type;

  if (!addCity) {
    let originalData;
    try {
      const rawOriginalData = await fs.readFile(updateFilePath, "utf8");
      originalData = JSON.parse(rawOriginalData);
    } catch (err: unknown) {
      const { message } = err as Error;
      return results.Err(
        `Issue reading the original data file path ${updateFilePath}: ${message}`,
      );
    }
    originalData.geometry.coordinates = newCoordinates;

    await fs.writeFile(updateFilePath, JSON.stringify(originalData, null, 2));
    return results.Ok("File updated successfully!");
  }
  const newFile = {
    type: "Feature",
    properties: { id: cityId },
    geometry: { type: newGeometryType, coordinates: newCoordinates },
  };
  await fs.writeFile(updateFilePath, JSON.stringify(newFile, null, 2));

  return results.Ok("File updated successfully!");
};

export { determineArgs, updateCoordinates, updateParkingLots };
