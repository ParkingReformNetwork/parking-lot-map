/* global document, navigator */
const fs = require("fs");
const puppeteer = require("puppeteer");
const {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
} = require("@jest/globals");

const port = process.env.PORT || 1234;
const url = `http://localhost:${port}`;

let browser;

beforeAll(async () => {
  browser = await puppeteer.launch();
  const context = browser.defaultBrowserContext();
  context.overridePermissions(url, ["clipboard-read"]);

  const err = async () => {
    await browser.close();
    throw new Error(
      `Server is not running at ${url}. In a new terminal tab, run 'npm start'.`
    );
  };
  try {
    const page = await browser.newPage();
    const response = await page.goto(url, {
      timeout: 1000,
    });
    await page.close();

    const isServerRunning = response !== null && response.status() < 400;
    if (!isServerRunning) {
      await err();
    }
  } catch (error) {
    await err();
  }
});

afterAll(async () => {
  await browser.close();
});

test("no console errors and warnings", async () => {
  const page = await browser.newPage();

  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warn") {
      errors.push(message.text());
    }
  });

  await page.goto(url);
  await page.close();

  expect(errors).toHaveLength(0);
});

test("every city is in the toggle", async () => {
  const data = fs.readFileSync("data/cities-polygons.geojson");
  const expectedCities = JSON.parse(data).features.map(
    (entry) => entry.properties.Name
  );

  const page = await browser.newPage();
  await page.goto(url);

  // Wait a second to make sure the site is fully loaded.
  await page.waitForTimeout(1000);

  const toggleValues = await page.evaluate(() => {
    const select = document.querySelector("#city-choice");
    return Array.from(select.querySelectorAll("option")).map((opt) =>
      opt.textContent.trim()
    );
  });
  await page.close();

  expectedCities.sort();
  expectedCities.splice(0, 0, "Select a city");
  expect(toggleValues).toEqual(expectedCities);
});

test("correctly load the city score card", async () => {
  const data = fs.readFileSync("data/cities-polygons.geojson");
  const anchorageEntries = JSON.parse(data)
    .features.filter((entry) => entry.properties.Name === "Anchorage, AK")
    .map((entry) => entry.properties);
  expect(anchorageEntries).toHaveLength(1);
  const anchorageExpected = anchorageEntries[0];

  const page = await browser.newPage();
  await page.goto(url);

  await page.select("#city-choice", "anchorage-ak");
  await page.waitForFunction(() => {
    const titleElement = document.querySelector(
      ".leaflet-popup-content .title"
    );
    return titleElement && titleElement.textContent === "Anchorage, AK";
  });

  const [content, cityToggleValue] = await page.evaluate(() => {
    const cityToggle = document.querySelector("#city-choice").value;

    const detailsTitles = Array.from(
      document.querySelectorAll(".leaflet-popup-content .details-title")
    ).map((el) => el.textContent);
    const detailsValues = Array.from(
      document.querySelectorAll(".leaflet-popup-content .details-value")
    ).map((el) => el.textContent);

    const details = {};
    detailsTitles.forEach((title, index) => {
      details[title] = detailsValues[index];
    });
    return [details, cityToggle];
  });
  await page.close();

  expect(cityToggleValue).toEqual("anchorage-ak");
  expect(content["Percent of Central City Devoted to Parking: "]).toEqual(
    anchorageExpected.Percentage
  );
  expect(content["Population: "]).toEqual(anchorageExpected.Population);
  expect(content["Metro Population: "]).toEqual(
    anchorageExpected["Metro Population"]
  );
  expect(content["Parking Score: "]).toEqual(
    anchorageExpected["Parking Score"]
  );
  expect(content["Parking Mandate Reforms: "]).toEqual(
    anchorageExpected.Reforms
  );
});

describe("the share feature", () => {
  test("share button writes the URL to the clipboard", async () => {
    const page = await browser.newPage();
    await page.goto(url);

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);

    await page.click(".url-copy-button > a");
    const firstCityClipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    // Check that the share button works when changing the city, too.
    // This is a regression test.
    await page.select("#city-choice", "anchorage-ak");
    await page.waitForFunction(() => {
      const titleElement = document.querySelector(
        ".leaflet-popup-content .title"
      );
      return titleElement && titleElement.textContent === "Anchorage, AK";
    });

    await page.click(".url-copy-button > a");
    const secondCityClipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    await page.close();

    expect(firstCityClipboardText).toBe(
      `${url}/#parking-reform-map=columbus-oh`
    );
    expect(secondCityClipboardText).toBe(
      `${url}/#parking-reform-map=anchorage-ak`
    );
  });

  test("loading from a share link works", async () => {
    // Regression test of https://github.com/ParkingReformNetwork/parking-lot-map/issues/10.
    const page = await browser.newPage();
    await page.goto(`${url}#parking-reform-map=fort-worth-tx`);

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);
    const [scoreCardTitle, cityToggleValue] = await page.evaluate(() => {
      const title = document.querySelector(
        ".leaflet-popup-content .title"
      ).textContent;
      const cityToggle = document.querySelector("#city-choice").value;
      return [title, cityToggle];
    });
    await page.close();

    expect(scoreCardTitle).toEqual("Fort Worth, TX");
    expect(cityToggleValue).toEqual("fort-worth-tx");
  });

  test("loading from a bad share link falls back to Columbus", async () => {
    const page = await browser.newPage();
    await page.goto(`${url}#parking-reform-map=bad-city`);

    // Wait a second to make sure the site is fully loaded.
    await page.waitForTimeout(1000);
    const [scoreCardTitle, cityToggleValue] = await page.evaluate(() => {
      const title = document.querySelector(
        ".leaflet-popup-content .title"
      ).textContent;
      const cityToggle = document.querySelector("#city-choice").value;
      return [title, cityToggle];
    });
    await page.close();

    expect(scoreCardTitle).toEqual("Columbus, OH");
    expect(cityToggleValue).toEqual("columbus-oh");
  });
});

test("about popup can be opened and closed", async () => {
  const page = await browser.newPage();
  await page.goto(url);

  const aboutIcon = ".banner-about";

  const aboutIsVisible = async (expected) => {
    const isVisible = await page.$eval(
      ".about-text-popup",
      (el) => el.style.display === "block"
    );
    return isVisible === expected;
  };

  const validBeforeClick = await aboutIsVisible(false);

  await page.click(aboutIcon);
  const validFirstClick = await aboutIsVisible(true);

  await page.click(aboutIcon);
  const validSecondClick = await aboutIsVisible(false);

  await page.click(aboutIcon);
  const validThirdClick = await aboutIsVisible(true);

  await page.click(".about-close");
  const validFourthClick = await aboutIsVisible(false);
  await page.close();

  expect(validBeforeClick).toBe(true);
  expect(validFirstClick).toBe(true);
  expect(validSecondClick).toBe(true);
  expect(validThirdClick).toBe(true);
  expect(validFourthClick).toBe(true);
});
