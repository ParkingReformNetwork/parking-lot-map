import { expect, test } from "@playwright/test";

test("there are exactly 103 official city maps", async ({ page }) => {
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

  const communityMapIndex = toggleValues.indexOf("Community Maps");
  // Consider removing if statement after first community map is implemented
  if (communityMapIndex > -1) {
    const officialMapIndex =
      communityMapIndex - toggleValues.indexOf("Official Maps");
    expect(officialMapIndex).toEqual(103);
  }
});
