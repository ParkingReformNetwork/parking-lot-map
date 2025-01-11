import { expect, test } from "@playwright/test";
import createDropdownGroups from "../src/js/dropdownGroups";

test("createDropdownGroups", () => {
  const common = {
    percentage: "",
    cityType: "",
    population: "",
    urbanizedAreaPopulation: "",
    parkingScore: null,
    reforms: "",
    url: "",
  };
  const input = {
    "city1-ny": {
      ...common,
      name: "City 1, NY",
    },
    "city2-ny": {
      ...common,
      name: "City 2, NY",
      contribution: "some-email@web.com",
    },
  };
  expect(createDropdownGroups(input)).toEqual([
    {
      label: "Official maps",
      cities: [{ id: "city1-ny", name: "City 1, NY" }],
    },
    {
      label: "Community maps",
      cities: [{ id: "city2-ny", name: "City 2, NY" }],
    },
  ]);
});
