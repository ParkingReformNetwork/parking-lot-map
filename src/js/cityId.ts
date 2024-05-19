import { CityId } from "./types";

/**
 * Extract the city ID from the URL's `#`, if present.
 *
 * @param windowUrl: The `window.location.href` global
 * @return: Returns e.g. `st.-louis-mo` if present, else the empty string
 */
const extractCityIdFromUrl = (windowUrl: string): string =>
  windowUrl.indexOf("#parking-reform-map=") === -1
    ? ""
    : windowUrl.split("#")[1].split("=")[1].toLowerCase();

/**
 * Parse the geojson's `Name` property into the city ID.
 *
 * @param jsonCityName: the `Name` property from JSON, e.g. `"My City, AZ"`
 * @return: the city ID, e.g. `st.-louis-mo`.
 */
const parseCityIdFromJson = (jsonCityName: string): string =>
  jsonCityName.toLowerCase().replace(/ /g, "-").replace(/,/g, "");

/**
 * Determine what URL to use to share the current city.
 *
 * @param windowUrl: the current page's URL
 * @param cityId: e.g. `st.-louis-mo`
 * @return: the URL to share
 */
const determineShareUrl = (windowUrl: string, cityId: CityId): string => {
  const [baseUrl] = windowUrl.split("#");
  return `${baseUrl}#parking-reform-map=${cityId}`;
};

export { determineShareUrl, extractCityIdFromUrl, parseCityIdFromJson };
