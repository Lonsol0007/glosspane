import { defineConfig } from "@playwright/test";

const PORT = 3217;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  webServer: {
    // Tests run against the production build, with no provider key on the server.
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: true,
    env: { ANTHROPIC_API_KEY: "" },
  },
});
