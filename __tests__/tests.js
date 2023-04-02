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
