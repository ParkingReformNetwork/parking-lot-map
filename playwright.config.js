import { defineConfig } from "@playwright/test";

// Note that we may run tests by using Parcel (development) vs running on the `dist` folder.
const port = process.env.PORT || 1234;
const webServerCommand = port === 1234 ? "start" : "serve-dist";

const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL,
  },
  webServer: {
    command: `npm run ${webServerCommand}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
