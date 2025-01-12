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
      group: "Group 1",
    },
    city2: {
      ...common,
      name: "City 2",
      group: "Group 2",
    },
    city3: {
      ...common,
      name: "City 3",
      group: "Group 3",
    },
    city4: {
      ...common,
      name: "City 4",
      group: "Group 1",
    },
  };
  expect(createDropdownGroups(input)).toEqual([
    {
      label: "Group 1",
      cities: [
        { id: "city1", name: "City 1" },
        { id: "city4", name: "City 4" },
      ],
    },
    {
      label: "Group 2",
      cities: [{ id: "city2", name: "City 2" }],
    },
    {
      label: "Group 3",
      cities: [{ id: "city3", name: "City 3" }],
    },
  ]);
});
