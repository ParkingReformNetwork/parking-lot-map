import { expect, test } from "@playwright/test";

import createDropdownGroups from "../src/js/dropdownGroups";

test("createDropdownGroups", () => {
  const common = {
    percentage: "",
    population: "",
    transitStation: null,
  };
  const input = {
    city1: {
      ...common,
      name: "City 1",
      county: "Fairfield County",
    },
    city2: {
      ...common,
      name: "City 2",
      county: "New London County",
    },
    city3: {
      ...common,
      name: "City 3",
      county: "New London County",
    },
    city4: {
      ...common,
      name: "City 4",
      county: "Windham County",
    },
  };
  expect(createDropdownGroups(input)).toEqual([
    {
      label: "Fairfield County",
      cities: [{ id: "city1", name: "City 1" }],
    },
    {
      label: "Hartford County",
      cities: [],
    },
    {
      label: "Litchfield County",
      cities: [],
    },
    {
      label: "Middlesex County",
      cities: [],
    },
    {
      label: "New Haven County",
      cities: [],
    },
    {
      label: "New London County",
      cities: [
        { id: "city2", name: "City 2" },
        { id: "city3", name: "City 3" },
      ],
    },
    {
      label: "Tolland County",
      cities: [],
    },
    {
      label: "Windham County",
      cities: [{ id: "city4", name: "City 4" }],
    },
  ]);
});
