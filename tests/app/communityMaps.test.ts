import { expect, test } from "@playwright/test";

test("there is exactly 103 official city maps", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".choices");
  const choices = await page.locator(".choices");
  await choices.click();
  await page.waitForSelector(".is-active");

  const toggleValues = await page.$eval(
    ".choices__list [role='listbox']",
    (element: HTMLElement) =>
      Array.from(element.children).map(
        (child: Element) => (child as HTMLElement).innerText
      )
  );

  const officialCities =
    toggleValues.indexOf("Community Maps") -
    toggleValues.indexOf("Official Maps") -
    1;
  expect(officialCities).toEqual(103);
});
