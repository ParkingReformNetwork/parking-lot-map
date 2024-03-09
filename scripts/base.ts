import fs from "fs/promises";
import {
  FeatureCollection,
  GeoJsonProperties,
  Polygon,
  Feature,
} from "geojson";
import { parseCityIdFromJson } from "../src/js/cityId.ts";
import { CityId } from "../src/js/types";

type ok<T> = { value: T };
type error = { error: string };
type OrError<T> = ok<T> | error;

// Rather than using `try/catch`, we return either `Ok` or `Err`.
// This emulates Rust's `Result` type.
const Ok = <T>(value?: T): OrError<T> => ({ value } as ok<T>);
const Err = <T>(err: string): OrError<T> => ({ error: err } as error);

export const valueOrExit = <T>(
  res: OrError<T>,
  f?: (msg: string) => string
): T => {
  if ("error" in res) {
    // eslint-disable-next-line no-console
    console.error(f ? f(res.error) : res.error);
    process.exit(1);
  }
  return res.value;
};

export const exitOnError = <T>(
  res: OrError<T>,
  f?: (msg: string) => string
): void => {
  valueOrExit(res, f);
};

/**
 * Determine the city name and city ID.
 *
 * @param string scriptCommand - e.g. `update-lots` or `update-city-boundaries`.
 * @param list[string] processArgv - all argv after the first two elements.
 * @return either an `error` or `value` object.
 */
const determineArgs: (
  scriptCommand: string,
  processArgv: string[]
) => OrError<{ cityName: string; cityId: CityId }> = (
  scriptCommand,
  processArgv
) => {
  if (processArgv.length !== 1) {
    return Err(
      `Must provide exactly one argument (the city/state name). For example,
       npm run ${scriptCommand} -- 'Columbus, OH'
       `
    );
  }
  const cityName = processArgv[0];
  const cityId = parseCityIdFromJson(cityName);
  return Ok({ cityName, cityId });
};

/**
 * Rewrite the coordinates for `cityId`.
 *
 * @param string scriptCommand - i.e. `update-lots` or `update-city-boundaries`.
 * @param string cityId - e.g. 'my-city-az'
 * @param boolean addCity - what to do if the city is missing
 * @param string originalFilePath - what will be updated
 * @param string updatedFilePath - where to get the new coordinates
 * @return either an `error` or `value` object. The `value` does not include follow up
      instructions, which you should log.
 */
const updateCoordinates = async (
  scriptCommand: string,
  cityId: CityId,
  addCity: boolean,
  originalFilePath: string,
  updateFilePath: string
) => {
  let newData: FeatureCollection<Polygon, GeoJsonProperties>;
  try {
    const rawNewData = await fs.readFile(updateFilePath, "utf8");
    newData = JSON.parse(rawNewData);
  } catch (err: unknown) {
    const { message } = err as Error;
    return Err(
      `Issue reading the update file path ${updateFilePath}: ${message}`
    );
  }

  if (!Array.isArray(newData.features) || newData.features.length !== 1) {
    return Err(
      "The script expects exactly one entry in `features` because you can only update one city at a time."
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
    return Err(
      `Issue reading the original data file path ${originalFilePath}: ${message}`
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
      (feature) => feature?.properties?.id === cityId
    );
    if (!cityOriginalData) {
      return Err(
        `City not found in ${originalFilePath}. To add a new city, run again with the '--add' flag, e.g. npm run ${scriptCommand} -- 'My City, AZ' --add`
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
  return Ok("File updated successfully!");
};

/**
 * Add or update a city's parking lot .geojson file.
 *
 * @param string cityId - e.g. 'my-city-az'
 * @param boolean addCity - whether a city exists or not
 * @param string originalFilePath - what will be updated
 * @param string updatedFilePath - where to get the new coordinates
 * @return either an `error` or `value` object. The `value` does not include follow up
      instructions, which you should log.
 */
const updateParkingLots = async (
  cityId: CityId,
  addCity: boolean,
  originalFilePath: string,
  updateFilePath: string
) => {
  let newData;
  try {
    const rawNewData = await fs.readFile(originalFilePath, "utf8");
    newData = JSON.parse(rawNewData);
  } catch (err: unknown) {
    const { message } = err as Error;
    return Err(
      `Issue reading the update file path parking-lots-update.geojson: ${message}`
    );
  }

  if (!Array.isArray(newData.features) || newData.features.length !== 1) {
    return Err(
      "The script expects exactly one entry in `features` because you can only update one city at a time."
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
      return Err(
        `Issue reading the original data file path ${updateFilePath}: ${message}`
      );
    }
    originalData.geometry.coordinates = newCoordinates;

    await fs.writeFile(updateFilePath, JSON.stringify(originalData, null, 2));
    return Ok("File updated successfully!");
  }
  const newFile = {
    type: "Feature",
    properties: { id: cityId },
    geometry: { type: newGeometryType, coordinates: newCoordinates },
  };
  await fs.writeFile(updateFilePath, JSON.stringify(newFile, null, 2));

  return Ok("File updated successfully!");
};

export {
  Ok,
  Err,
  determineArgs,
  updateCoordinates,
  updateParkingLots,
  OrError,
  error,
  ok,
};
