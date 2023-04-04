const { describe, expect, test } = require("@jest/globals");
const {
  extractLocationTag,
  determineShareUrl,
  parseCityName,
} = require("../js/script");

describe("extractLocationTag()", () => {
  test("returns empty when no relevant # fragment", () => {
    expect(extractLocationTag("")).toEqual("");
    expect(extractLocationTag("https://parking.org")).toEqual("");
    expect(extractLocationTag("https://parking.org#shoup")).toEqual("");
    expect(
      extractLocationTag("https://parking.org#parking-reform-map")
    ).toEqual("");
  });

  test("extracts one-word cities", () => {
    expect(
      extractLocationTag("https://parking.org#parking-reform-map=city")
    ).toEqual("city");
    expect(
      extractLocationTag("https://parking.org#parking-reform-map=CITY")
    ).toEqual("city");
  });

  test("extracts multi-word cities", () => {
    expect(
      extractLocationTag(
        "https://parking.org#parking-reform-map=city%20of%20shoup"
      )
    ).toEqual("city of shoup");
    expect(
      extractLocationTag(
        "https://parking.org#parking-reform-map=CITY%20OF%20SHOUP"
      )
    ).toEqual("city of shoup");
  });
});

test("parseCityName() extracts the city", () => {
  expect(parseCityName("City, AZ")).toEqual("city");
  expect(parseCityName("CITY, AZ")).toEqual("city");
  expect(parseCityName("Saint Shoup Village, AZ")).toEqual(
    "saint shoup village"
  );
});

describe("determineShareUrl()", () => {
  test("adds #parking-reform-map= if not yet present", () => {
    expect(determineShareUrl("https://parking.org", "City, AZ")).toEqual(
      "https://parking.org#parking-reform-map=city"
    );
    expect(
      determineShareUrl("https://parking.org", "Saint Shoup Village, AZ")
    ).toEqual("https://parking.org#parking-reform-map=saint%20shoup%20village");
  });

  test("replaces any existing # in the URL", () => {
    // We may want to make this more intelligent to preserve existing hashes. But we currently
    // don't have any use for hashes other than pre-defining the city. So this is simpler.
    expect(
      determineShareUrl("https://parking.org#already-hash", "City, AZ")
    ).toEqual("https://parking.org#parking-reform-map=city");
    expect(
      determineShareUrl(
        "https://parking.org#parking-reform-map=another%20city",
        "City, AZ"
      )
    ).toEqual("https://parking.org#parking-reform-map=city");
  });
});
