import { fileURLToPath } from "node:url";

/**
 * Runs `main` unless imported under a test environment, where the test file
 * is expected to call `main` itself.
 *
 * Scripts use file paths relative to the repository root, but
 * `pnpm -F scripts <cmd>` runs them from packages/scripts, so change into
 * the repo root first.
 */
export function runScript(main: () => Promise<void>): void {
  if (process.env.NODE_ENV !== "test") {
    process.chdir(fileURLToPath(new URL("../../..", import.meta.url)));
    main().catch((error) => {
      console.error(error);
      process.exit(1);
    });
  }
}
