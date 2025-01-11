import { expect, test } from "@playwright/test";

import {
  formatHeader,
  formatReformLine,
} from "@prn-parking-lots/shared/src/js/city-ui/scorecard.ts";

import formatScorecard, { COMMUNITY_WARNING } from "../src/js/scorecard.ts";

test.describe("formatScorecard", () => {
  test("full stats", () => {
    const { header, listEntries } = formatScorecard({
      name: "Hartford, CT",
      percentage: "25%",
      population: "42,412",
      reforms: "adopted",
      url: "https://parkingreform.org",
      cityType: "suburb",
      urbanizedAreaPopulation: "104,241",
      parkingScore: "88",
      contribution: "email@parkingreform.org",
    });
    expect(header).toEqual(
      formatHeader({
        name: "Hartford, CT",
        percentage: "25%",
        boundaryDescription: "central city",
      }) + COMMUNITY_WARNING,
    );
    expect(listEntries).toEqual([
      "88/100 parking score (lower is better)",
      "City type: suburb",
      "42,412 city residents",
      "104,241 urbanized area residents",
      formatReformLine("adopted", "https://parkingreform.org"),
      `<a href="mailto:email@parkingreform.org">Email data maintainer</a>`,
    ]);
  });

  test("minimal stats", () => {
    const { header, listEntries } = formatScorecard({
      name: "Hartford, CT",
      percentage: "25%",
      population: "42,412",
      reforms: null,
      url: null,
      cityType: "suburb",
      urbanizedAreaPopulation: "104,241",
      parkingScore: null,
      contribution: null,
    });
    expect(header).toEqual(
      formatHeader({
        name: "Hartford, CT",
        percentage: "25%",
        boundaryDescription: "central city",
      }),
    );
    expect(listEntries).toEqual([
      "City type: suburb",
      "42,412 city residents",
      "104,241 urbanized area residents",
    ]);
  });
});
