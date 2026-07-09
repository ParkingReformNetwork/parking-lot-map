import { expect, test } from "@playwright/test";

test("about popup can be opened and closed", async ({ page }) => {
  await page.goto("");

  const aboutIcon = ".header-about-icon-container";

  const aboutIsVisible = async () =>
    page.$eval(".about-popup", (el) => (el as HTMLDialogElement).open);

  // before click
  expect(await aboutIsVisible()).toBe(false);

  // click about icon (open popup)
  await page.click(aboutIcon);
  expect(await aboutIsVisible()).toBe(true);

  // click x icon in popup
  await page.click(".about-popup-close-icon-container");
  expect(await aboutIsVisible()).toBe(false);

  // click about icon (open popup)
  await page.click(aboutIcon);
  expect(await aboutIsVisible()).toBe(true);

  // click the backdrop, outside the dialog's content box
  await page.mouse.click(5, 5);
  expect(await aboutIsVisible()).toBe(false);
});
