import { expect, test } from "@playwright/test";
import createDropdownRequest from "../src/js/dropdownRequest";

test("createDropdownRequest", () => {
  const common = {
    percentage: "",
    cityType: "",
    population: "",
    urbanizedAreaPopulation: "",
    parkingScore: null,
    reforms: "",
    url: null,
  };
  const input = {
    "city1-ny": {
      ...common,
      name: "City 1, NY",
      contribution: null,
    },
    "city2-ny": {
      ...common,
      name: "City 2, NY",
      contribution: "some-email@web.com",
    },
  };
  expect(createDropdownRequest(input)).toEqual({
    useGroups: true,
    value: [
      {
        label: "Official maps",
        cities: [{ id: "city1-ny", name: "City 1, NY" }],
      },
      {
        label: "Community maps",
        cities: [{ id: "city2-ny", name: "City 2, NY" }],
      },
    ],
  });
});
