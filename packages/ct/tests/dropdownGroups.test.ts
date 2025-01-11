import { expect, test } from "@playwright/test";

import createDropdownGroups from "../src/js/dropdownGroups";

test("createDropdownGroups", () => {
  const common = {
    percentage: "",
    population: "",
    reforms: "",
    url: null,
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
  expect(createDropdownGroups(input)).toEqual([
    {
      label: "Group 1",
      cities: [
        { id: "city1", name: "City 1" },
        { id: "city2", name: "City 2" },
      ],
    },
  ]);
});
