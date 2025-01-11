import { expect, test } from "@playwright/test";

import {
  extractCityIdFromUrl,
  determineShareUrl,
  parseCityIdFromJson,
} from "../src/js/model/cityId";

test.describe("extractCityIdFromUrl()", () => {
  test("returns null when no relevant # fragment", () => {
    expect(extractCityIdFromUrl("")).toBeNull();
    expect(extractCityIdFromUrl("https://parking.org")).toBeNull();
    expect(extractCityIdFromUrl("https://parking.org#shoup")).toBeNull();
    expect(extractCityIdFromUrl("https://parking.org#city")).toBeNull();
    expect(
      extractCityIdFromUrl("https://parking.org#parking-reform-map"),
    ).toBeNull();
  });

  test("extracts the city id", () => {
    expect(extractCityIdFromUrl("https://parking.org#city=my-city")).toEqual(
      "my-city",
    );
    expect(
      extractCityIdFromUrl("https://parking.org#parking-reform-map=MY-CITY"),
    ).toEqual("my-city");
    expect(extractCityIdFromUrl("https://parking.org#city=st.-louis")).toEqual(
      "st-louis",
    );
  });
});

test("parseCityIdFromJson() extracts the city", () => {
  expect(parseCityIdFromJson("Tempe, AZ")).toEqual("tempe-az");
  expect(parseCityIdFromJson("TEMPE, AZ")).toEqual("tempe-az");
  expect(parseCityIdFromJson("Saint Shoup Village, AZ")).toEqual(
    "saint-shoup-village-az",
  );
  expect(parseCityIdFromJson("St. Shoup Village, AZ")).toEqual(
    "st-shoup-village-az",
  );
  expect(parseCityIdFromJson("No state")).toEqual("no-state");
  expect(parseCityIdFromJson("Hartford - rail station")).toEqual(
    "hartford-rail-station",
  );
});

test.describe("determineShareUrl()", () => {
  test("adds #city= if not yet present", () => {
    expect(determineShareUrl("https://parking.org", "tempe-az")).toEqual(
      "https://parking.org#city=tempe-az",
    );
    expect(
      determineShareUrl("https://parking.org", "saint-shoup-village-az"),
    ).toEqual("https://parking.org#city=saint-shoup-village-az");
  });

  test("replaces any existing # in the URL", () => {
    // We may want to make this more intelligent to preserve existing hashes. But we currently
    // don't have any use for hashes other than pre-defining the city. So this is simpler.
    expect(
      determineShareUrl("https://parking.org#already-hash", "tempe-az"),
    ).toEqual("https://parking.org#city=tempe-az");
    expect(
      determineShareUrl("https://parking.org#city=another-city-ny", "tempe-az"),
    ).toEqual("https://parking.org#city=tempe-az");
  });
});
