import fs from "node:fs/promises";
import { parseCityIdFromJson } from "@prn-parking-lots/shared/src/js/model/cityId.ts";
import type { CityId } from "@prn-parking-lots/shared/src/js/model/types";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Polygon,
} from "geojson";

export type Pkg = "primary" | "ct";

interface Args {
  pkg: Pkg;
  cityName: string;
  cityId: CityId;
}

export function determineArgs(
  scriptCommand: string,
  processArgv: string[],
): Args {
  if (processArgv.length !== 2) {
    throw new Error(
      `Must provide exactly two arguments: 1) either 'ct' or 'primary' for the app and 2) the city name. For example,
       pnpm -F scripts ${scriptCommand} -- 'primary' 'Columbus, OH'
       `,
    );
  }
  const [pkg, cityName] = processArgv;
  if (pkg !== "ct" && pkg !== "primary") {
    throw new Error(`Unrecognized package '${pkg}'. Must be 'ct' or 'primary'`);
  }
  const cityId = parseCityIdFromJson(cityName);
  return { pkg, cityName, cityId };
}

export async function readJson<T>(
  filePath: string,
  description: string,
): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    const { message } = err as Error;
    throw new Error(
      `Issue reading the ${description} file path ${filePath}: ${message}`,
    );
  }
}

export function compareIds(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

export async function updateCoordinates(
  scriptCommand: string,
  cityId: CityId,
  addCity: boolean,
  originalFilePath: string,
  updateFilePath: string,
): Promise<void> {
  const newData = await readJson<FeatureCollection<Polygon, GeoJsonProperties>>(
    updateFilePath,
    "update",
  );

  if (!Array.isArray(newData.features) || newData.features.length !== 1) {
    throw new Error(
      "The script expects exactly one entry in `features` because you can only update one city at a time.",
    );
  }

  const polygon = newData.features[0].geometry;
  const newCoordinates = polygon.coordinates;
  const newGeometryType = polygon.type;

  const originalData = await readJson<
    FeatureCollection<Polygon, GeoJsonProperties>
  >(originalFilePath, "original data");

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
      throw new Error(
        `City not found in ${originalFilePath}. To add a new city, run again with the '--add' flag, e.g. npm run ${scriptCommand} -- 'My City, AZ' --add`,
      );
    }
    cityOriginalData.geometry.coordinates = newCoordinates;
  }

  // Make sure the data is still sorted.
  originalData.features.sort((a, b) =>
    compareIds(a.properties?.id, b.properties?.id),
  );

  await fs.writeFile(originalFilePath, JSON.stringify(originalData, null, 2));
}

export async function updateParkingLots(
  cityId: CityId,
  addCity: boolean,
  updateFilePath: string,
  originalFilePath: string,
): Promise<void> {
  const newData = await readJson<FeatureCollection<Polygon, GeoJsonProperties>>(
    updateFilePath,
    "update",
  );

  if (!Array.isArray(newData.features) || newData.features.length !== 1) {
    throw new Error(
      "The script expects exactly one entry in `features` because you can only update one city at a time.",
    );
  }

  const newCoordinates = newData.features[0].geometry.coordinates;
  const newGeometryType = newData.features[0].geometry.type;

  if (!addCity) {
    const originalData = await readJson<Feature<Polygon, GeoJsonProperties>>(
      originalFilePath,
      "original data",
    );
    originalData.geometry.coordinates = newCoordinates;

    await fs.writeFile(originalFilePath, JSON.stringify(originalData, null, 2));
    return;
  }

  const newFile = {
    type: "Feature",
    properties: { id: cityId },
    geometry: { type: newGeometryType, coordinates: newCoordinates },
  };
  await fs.writeFile(originalFilePath, JSON.stringify(newFile, null, 2));
}
