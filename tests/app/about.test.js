import { expect, test } from "@playwright/test";

test("about popup can be opened and closed", async ({ page }) => {
  await page.goto("");

  const aboutIcon = ".header-about-icon";

  const aboutIsVisible = async () =>
    page.$eval(".about-text-popup", (el) => el.style.display === "block");

  // before click
  expect(await aboutIsVisible()).toBe(false);

  // click about icon (open popup)
  await page.click(aboutIcon);
  expect(await aboutIsVisible()).toBe(true);

  // click about icon (close popup)
  await page.click(aboutIcon);
  expect(await aboutIsVisible()).toBe(false);

  // click about icon (open popup)
  await page.click(aboutIcon);
  expect(await aboutIsVisible()).toBe(true);

  // click x icon in popup
  await page.click(".about-close");
  expect(await aboutIsVisible()).toBe(false);

  // click about icon (open popup)
  await page.click(aboutIcon);
  expect(await aboutIsVisible()).toBe(true);

  // click header
  await page.click("header");
  expect(await aboutIsVisible()).toBe(false);
});
