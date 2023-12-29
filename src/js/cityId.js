/**
 * Extract the city ID from the URL's `#`, if present.
 *
 * @param string windowUrl: The `window.location.href` global
 * @return string: Returns e.g. `st.-louis-mo` if present, else the empty string
 */
const extractCityIdFromUrl = (windowUrl) =>
  windowUrl.indexOf("#parking-reform-map=") === -1
    ? ""
    : windowUrl.split("#")[1].split("=")[1].toLowerCase();

/**
 * Parse the geojson's `Name` property into the city ID.
 *
 * @param string jsonCityName: the `Name` property from JSON, e.g. `"My City, AZ"`
 * @return string: the city ID, e.g. `st.-louis-mo`.
 */
const parseCityIdFromJson = (jsonCityName) =>
  jsonCityName.toLowerCase().replace(/ /g, "-").replace(/,/g, "");

/**
 * Determine what URL to use to share the current city.
 *
 * @param string windowUrl: the current page's URL
 * @param string cityId: e.g. `st.-louis-mo`
 * @return string: the URL to share
 */
const determineShareUrl = (windowUrl, cityId) => {
  const [baseUrl] = windowUrl.split("#");
  return `${baseUrl}#parking-reform-map=${cityId}`;
};

export { determineShareUrl, extractCityIdFromUrl, parseCityIdFromJson };
