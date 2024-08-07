import { CityId } from "./types";

/**
 * Extract the city ID from the URL's `#`, if present.
 */
export function extractCityIdFromUrl(windowUrl: string): string | null {
  return windowUrl.indexOf("#parking-reform-map=") === -1
    ? null
    : windowUrl.split("#")[1].split("=")[1].toLowerCase();
}

/**
 * Parse the geojson's `Name` property into the city ID.
 *
 * @param jsonCityName: the `Name` property from JSON, e.g. `"My City, AZ"`
 * @return: the city ID, e.g. `st.-louis-mo`.
 */
export function parseCityIdFromJson(jsonCityName: string): string {
  return jsonCityName.toLowerCase().replace(/ /g, "-").replace(/,/g, "");
}

/**
 * Determine what URL to use to share the current city.
 *
 * @param windowUrl: the current page's URL
 * @param cityId: e.g. `st.-louis-mo`
 * @return: the URL to share
 */
export function determineShareUrl(windowUrl: string, cityId: CityId): string {
  const [baseUrl] = windowUrl.split("#");
  return `${baseUrl}#parking-reform-map=${cityId}`;
}
