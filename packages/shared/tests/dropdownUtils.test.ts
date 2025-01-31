import { expect, test } from "@playwright/test";
import {
  createChoice,
  convertToChoicesJs,
} from "../src/js/city-ui/dropdownUtils";

test.describe("createChoice()", () => {
  test("city and state", () => {
    expect(createChoice({ id: "tempe-az", name: "Tempe, AZ" })).toEqual({
      value: "tempe-az",
      label: "Tempe, AZ",
      customProperties: { city: "Tempe", context: "AZ" },
    });
  });

  test("city and descriptor", () => {
    expect(
      createChoice({ id: "tempe-rail-station", name: "Tempe - rail station" }),
    ).toEqual({
      value: "tempe-rail-station",
      label: "Tempe - rail station",
      customProperties: { city: "Tempe", context: "rail station" },
    });
  });

  test("only city", () => {
    expect(createChoice({ id: "tempe", name: "Tempe" })).toEqual({
      value: "tempe",
      label: "Tempe",
      customProperties: { city: "Tempe", context: "" },
    });
  });
});

test.describe("convertToChoicesJs()", () => {
  const city1 = { id: "city1", name: "City 1" };
  const city2 = { id: "city2", name: "City 2" };
  const city3 = { id: "city2", name: "City 3" };

  const city1Choice = createChoice({ id: city1.id, name: city1.name });
  const city2Choice = createChoice({ id: city2.id, name: city2.name });
  const city3Choice = createChoice({ id: city3.id, name: city3.name });

  test("use groups", () => {
    const input = [
      { label: "group 1", cities: [city1] },
      { label: "hidden", cities: [] },
      { label: "group 2", cities: [city2, city3] },
    ];
    expect(convertToChoicesJs({ useGroups: true, value: input })).toEqual([
      {
        value: "group 1",
        label: "group 1",
        disabled: false,
        choices: [city1Choice],
      },
      {
        value: "group 2",
        label: "group 2",
        disabled: false,
        choices: [city2Choice, city3Choice],
      },
    ]);
  });

  test("don't use groups", () => {
    const input = [city1, city2, city3];
    expect(convertToChoicesJs({ useGroups: false, value: input })).toEqual([
      city1Choice,
      city2Choice,
      city3Choice,
    ]);
  });
});
