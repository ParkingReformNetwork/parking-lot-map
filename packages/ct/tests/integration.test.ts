import { expect, test } from "@playwright/test";

import {
  getAllDropdownValues,
  loadMap,
  readCityStats,
} from "@prn-parking-lots/shared/tests/integrationUtils.ts";

test("every city is in the dropdown", async ({ page }) => {
  const cityStats = await readCityStats();
  const expectedCities = Object.values(cityStats).map(({ name }) => name);
  await loadMap(page);
  const dropdownValues = await getAllDropdownValues(page);
  expect(dropdownValues).toEqual(expectedCities);
});
