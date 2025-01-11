import { kebabCase } from "lodash-es";

import type { CityId } from "./types";

export function extractCityIdFromUrl(windowUrl: string): string | null {
  if (
    windowUrl.indexOf("#city=") === -1 &&
    // This was the legacy anchor link. We still read it.
    windowUrl.indexOf("#parking-reform-map=") === -1
  )
    return null;
  const anchor = windowUrl.split("#")[1];
  const arg = anchor.split("=")[1];
  return arg.toLowerCase().replace(".", "");
}

/**
 * Parse the geojson's `Name` property into the city ID.
 *
 * @param jsonCityName: the `Name` property from JSON, e.g. `"My City, AZ"`
 * @return: the city ID, e.g. `st-louis-mo`.
 */
export function parseCityIdFromJson(jsonCityName: string): string {
  return kebabCase(jsonCityName);
}

export function determineShareUrl(windowUrl: string, cityId: CityId): string {
  const [baseUrl] = windowUrl.split("#");
  return `${baseUrl}#city=${cityId}`;
}
