import { expect, test } from "@playwright/test";
import { createChoice } from "../src/js/city-ui/dropdownUtils";

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
