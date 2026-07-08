import { expect, test } from "@playwright/test";

import { formatHeader, formatReformLine } from "../src/js/city-ui/scorecard.ts";

test("formatHeader", () => {
  const result = formatHeader({
    name: "My City",
    percentage: "25%",
    boundaryDescription: "downtown",
  });
  expect(result).toEqual(`
    <h1 class="scorecard-title">Parking lots in My City</h1>
    <p>25% of the downtown is off-street parking</p>
    `);
});

test("formatReformLine", () => {
  const result = formatReformLine("adopted", "https://parkingreform.org");
  expect(result).toEqual(
    `Parking reforms adopted (<a class="external-link" title="view parking reform details" href="https://parkingreform.org" target="_blank">details <svg aria-hidden="true" width="1em" height="1em"><use href="#icon-arrow-right"></use></svg></a>)`,
  );
});
