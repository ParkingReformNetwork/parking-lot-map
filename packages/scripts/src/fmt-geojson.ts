import fs from "node:fs/promises";

import { formatJson } from "./formatJson.ts";
import { runScript } from "./runScript.ts";

// Formats the data .geojson files, which `biome check` skips. With `--check`,
// only reports unformatted files and exits non-zero if there are any.

async function main(): Promise<void> {
  const check = process.argv.slice(2).includes("--check");
  const unformatted: string[] = [];
  for await (const filePath of fs.glob("packages/*/data/**/*.geojson")) {
    const content = await fs.readFile(filePath, "utf8");
    const formatted = await formatJson(content);
    if (formatted === content) continue;
    unformatted.push(filePath);
    if (!check) await fs.writeFile(filePath, formatted);
  }

  if (unformatted.length === 0) return;
  if (check) {
    console.error(
      `These GeoJSON files are not formatted. Run 'pnpm fmt' to fix:\n  ${unformatted.join("\n  ")}`,
    );
    process.exit(1);
  }
  console.log(`Formatted:\n  ${unformatted.join("\n  ")}`);
}

runScript(main);
