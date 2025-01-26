import { expect, test } from "@playwright/test";

import { formatReformLine } from "@prn-parking-lots/shared/src/js/city-ui/scorecard.ts";

import formatScorecard from "../src/js/scorecard.ts";

test.describe("formatScorecard", () => {
  test("full stats", () => {
    const { listEntries } = formatScorecard({
      name: "Hartford - rail station",
      percentage: "25%",
      population: "42,412",
      reforms: "adopted",
      url: "https://parkingreform.org",
      group: "",
      transitStation: "Bethel",
      transitService: "moderate",
      county: "Fairfield County",
      cog: "Western Connecticut",
    });
    expect(listEntries).toEqual([
      "42,412 city residents",
      "Transit station: Bethel",
      "Has moderate transit service",
      "Fairfield County",
      "Western Connecticut Council of Governments (COG)",
      formatReformLine("adopted", "https://parkingreform.org"),
    ]);
  });

  test("minimum stats", () => {
    const { listEntries } = formatScorecard({
      name: "Hartford - rail station",
      percentage: "25%",
      population: "42,412",
      reforms: null,
      url: null,
      group: "",
      transitStation: null,
      transitService: null,
      county: "Fairfield County",
      cog: "Western Connecticut",
    });
    expect(listEntries).toEqual([
      "42,412 city residents",
      "Fairfield County",
      "Western Connecticut Council of Governments (COG)",
    ]);
  });
});
