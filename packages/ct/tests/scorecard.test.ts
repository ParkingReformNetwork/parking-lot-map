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
    });
    expect(listEntries).toEqual([
      "42,412 city residents",
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
    });
    expect(listEntries).toEqual(["42,412 city residents"]);
  });
});
