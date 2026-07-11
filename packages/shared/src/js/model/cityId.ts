import { kebabCase } from "lodash-es";

import type {
  BaseCityStats,
  CityEntry,
  CityEntryCollection,
  CityId,
} from "./types";

export function parseCityId(raw: string): CityId {
  if (!raw) {
    throw new Error("City ID cannot be empty.");
  }
  return raw as CityId;
}

export function extractCityIdFromUrl(windowUrl: string): CityId | null {
  if (
    windowUrl.indexOf("#city=") === -1 &&
    // This was the legacy anchor link. We still read it.
    windowUrl.indexOf("#parking-reform-map=") === -1
  )
    return null;
  const anchor = windowUrl.split("#")[1];
  const arg = anchor.split("=")[1];
  return parseCityId(arg.toLowerCase().replace(".", ""));
}

/**
 * Parse the geojson's `Name` property into the city ID.
 *
 * @param jsonCityName: the `Name` property from JSON, e.g. `"My City, AZ"`
 * @return: the city ID, e.g. `st-louis-mo`.
 */
export function parseCityIdFromJson(jsonCityName: string): CityId {
  return parseCityId(kebabCase(jsonCityName));
}

export function determineShareUrl(windowUrl: string, cityId: CityId): string {
  const [baseUrl] = windowUrl.split("#");
  return `${baseUrl}#city=${cityId}`;
}

export function cityIdKeys<V>(record: Record<CityId, V>): CityId[] {
  return Object.keys(record) as CityId[];
}

export function cityIdEntries<V>(record: Record<CityId, V>): [CityId, V][] {
  return Object.entries(record) as [CityId, V][];
}

export function getCityEntry<T extends BaseCityStats>(
  cityEntries: CityEntryCollection<T>,
  cityId: CityId,
): CityEntry<T> {
  const entry = cityEntries[cityId];
  if (!entry) {
    throw new Error(`No city entry found for city id "${cityId}".`);
  }
  return entry;
}
