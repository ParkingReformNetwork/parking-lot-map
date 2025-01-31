import { expect, test } from "@playwright/test";

import createDropdownRequest from "../src/js/dropdownRequest";

test("createDropdownRequest", () => {
  const common = {
    percentage: "",
    population: "",
    transitStation: null,
    county: "",
  };
  const input = {
    city1: {
      ...common,
      name: "City 1",
    },
    city2: {
      ...common,
      name: "City 2",
    },
  };
  expect(createDropdownRequest(input)).toEqual({
    useGroups: false,
    value: [
      { id: "city1", name: "City 1" },
      { id: "city2", name: "City 2" },
    ],
  });
});
