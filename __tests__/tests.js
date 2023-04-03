const fs = require("fs");
const puppeteer = require("puppeteer");
const { beforeAll, expect, test } = require("@jest/globals");

beforeAll(async () => {
  const err = new Error(
    "Server is not running at http://localhost:8080. In a new terminal tab, run `npm start`."
  );
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    const response = await page.goto("http://localhost:8080", {
      timeout: 1000,
    });
    await browser.close();

    const isServerRunning = response !== null && response.status() < 400;
    if (!isServerRunning) {
      throw err;
    }
  } catch (error) {
    await browser.close();
    throw err;
  }
});

test("no console errors and warnings", async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warn") {
      errors.push(message.text());
    }
  });

  await page.goto("http://localhost:8080");
  await browser.close();

  expect(errors).toHaveLength(0);
});

test("every city is in the toggle", async () => {
  const data = fs.readFileSync("data/cities-polygons.geojson");
  const expectedCities = JSON.parse(data)["features"].map(
    (entry) => entry["properties"]["Name"]
  );
  expectedCities.push("Select a city");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:8080");

  const toggleValues = await page.evaluate(() => {
    const select = document.querySelector("#city-choice");
    return Array.from(select.querySelectorAll("option")).map((opt) =>
      opt.textContent.trim()
    );
  });
  await browser.close();

  toggleValues.sort();
  expectedCities.sort();
  expect(toggleValues).toEqual(expectedCities);
});

test("correctly load the city score card", async () => {
  const data = fs.readFileSync("data/cities-polygons.geojson");
  const anchorageEntries = JSON.parse(data)
    ["features"].filter(
      (entry) => entry["properties"]["Name"] === "Anchorage, AK"
    )
    .map((entry) => entry["properties"]);
  expect(anchorageEntries).toHaveLength(1);
  const anchorageExpected = anchorageEntries[0];

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:8080");

  await page.select("#city-choice", "Anchorage, AK");
  await page.waitForFunction(() => {
    const titleElement = document.querySelector(
      ".leaflet-popup-content .title"
    );
    return titleElement && titleElement.textContent === "Anchorage, AK";
  });

  const content = await page.evaluate(() => {
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
    return {
      ...details,
    };
  });
  await browser.close();

  expect(content["Percent of Central City Devoted to Parking: "]).toEqual(
    anchorageExpected["Percentage"]
  );
  expect(content["Population: "]).toEqual(anchorageExpected["Population"]);
  expect(content["Metro Population: "]).toEqual(
    anchorageExpected["Metro Population"]
  );
  expect(content["Parking Score: "]).toEqual(
    anchorageExpected["Parking Score"]
  );
  expect(content["Parking Mandate Reforms: "]).toEqual(
    anchorageExpected["Reforms"]
  );
});
