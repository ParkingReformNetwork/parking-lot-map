import { expect, test } from "@playwright/test";

import formatScorecard from "../src/js/scorecard.ts";

test.describe("formatScorecard", () => {
  test("full stats", () => {
    const { listEntries } = formatScorecard({
      name: "Hartford - rail station",
      percentage: "25%",
      population: "42,412",
      transitStation: "Bethel",
      county: "Fairfield County",
    });
    expect(listEntries).toEqual([
      "42,412 city residents",
      "Transit station: Bethel",
      "Fairfield County",
    ]);
  });

  test("minimum stats", () => {
    const { listEntries } = formatScorecard({
      name: "Hartford - rail station",
      percentage: "25%",
      population: "42,412",
      transitStation: null,
      county: "Fairfield County",
    });
    expect(listEntries).toEqual(["42,412 city residents", "Fairfield County"]);
  });
});
