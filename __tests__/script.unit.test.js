const { describe, expect, test } = require("@jest/globals");
const {
  extractCityIdFromUrl,
  determineShareUrl,
  parseCityIdFromJson,
} = require("../src/js/script");

describe("extractCityIdFromUrl()", () => {
  test("returns empty when no relevant # fragment", () => {
    expect(extractCityIdFromUrl("")).toEqual("");
    expect(extractCityIdFromUrl("https://parking.org")).toEqual("");
    expect(extractCityIdFromUrl("https://parking.org#shoup")).toEqual("");
    expect(
      extractCityIdFromUrl("https://parking.org#parking-reform-map")
    ).toEqual("");
  });

  test("extracts the city id", () => {
    expect(
      extractCityIdFromUrl("https://parking.org#parking-reform-map=city")
    ).toEqual("city");
    expect(
      extractCityIdFromUrl("https://parking.org#parking-reform-map=CITY")
    ).toEqual("city");
    expect(
      extractCityIdFromUrl(
        "https://parking.org#parking-reform-map=city-of-shoup"
      )
    ).toEqual("city-of-shoup");
    expect(
      extractCityIdFromUrl(
        "https://parking.org#parking-reform-map=CITY-OF-SHOUP"
      )
    ).toEqual("city-of-shoup");
  });
});

test("parseCityIdFromJson() extracts the city", () => {
  expect(parseCityIdFromJson("City, AZ")).toEqual("city-az");
  expect(parseCityIdFromJson("CITY, AZ")).toEqual("city-az");
  expect(parseCityIdFromJson("Saint Shoup Village, AZ")).toEqual(
    "saint-shoup-village-az"
  );
});

describe("determineShareUrl()", () => {
  test("adds #parking-reform-map= if not yet present", () => {
    expect(determineShareUrl("https://parking.org", "city-az")).toEqual(
      "https://parking.org#parking-reform-map=city-az"
    );
    expect(
      determineShareUrl("https://parking.org", "saint-shoup-village-az")
    ).toEqual("https://parking.org#parking-reform-map=saint-shoup-village-az");
  });

  test("replaces any existing # in the URL", () => {
    // We may want to make this more intelligent to preserve existing hashes. But we currently
    // don't have any use for hashes other than pre-defining the city. So this is simpler.
    expect(
      determineShareUrl("https://parking.org#already-hash", "city-az")
    ).toEqual("https://parking.org#parking-reform-map=city-az");
    expect(
      determineShareUrl(
        "https://parking.org#parking-reform-map=another-city-ny",
        "city-az"
      )
    ).toEqual("https://parking.org#parking-reform-map=city-az");
  });
});
