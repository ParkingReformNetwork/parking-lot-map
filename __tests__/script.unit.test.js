const { expect, test } = require("@jest/globals");
require("../js/script");

test("script.js can be imported", () => {
  expect(true).toBe(true);
});
