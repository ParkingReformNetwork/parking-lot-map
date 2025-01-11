import { expect, test } from "@playwright/test";
import {
  createChoice,
  convertToChoicesGroups,
} from "../src/js/city-ui/dropdownUtils";

test.describe("createChoice()", () => {
  test("city and state", () => {
    expect(createChoice("tempe-az", "Tempe, AZ")).toEqual({
      value: "tempe-az",
      label: "Tempe, AZ",
      customProperties: { city: "Tempe", context: "AZ" },
    });
  });

  test("city and descriptor", () => {
    expect(createChoice("tempe-rail-station", "Tempe - rail station")).toEqual({
      value: "tempe-rail-station",
      label: "Tempe - rail station",
      customProperties: { city: "Tempe", context: "rail station" },
    });
  });

  test("only city", () => {
    expect(createChoice("tempe", "Tempe")).toEqual({
      value: "tempe",
      label: "Tempe",
      customProperties: { city: "Tempe", context: "" },
    });
  });
});

test("convertToChoicesGroups()", () => {
  const city1 = { id: "city1", name: "City 1" };
  const city2 = { id: "city2", name: "City 2" };
  const city3 = { id: "city2", name: "City 3" };
  const input = [
    { label: "group 1", cities: [city1] },
    { label: "hidden", cities: [] },
    { label: "group 2", cities: [city2, city3] },
  ];
  expect(convertToChoicesGroups(input)).toEqual([
    {
      value: "group 1",
      label: "group 1",
      disabled: false,
      choices: [createChoice(city1.id, city1.name)],
    },
    {
      value: "group 2",
      label: "group 2",
      disabled: false,
      choices: [
        createChoice(city2.id, city2.name),
        createChoice(city3.id, city3.name),
      ],
    },
  ]);
});
