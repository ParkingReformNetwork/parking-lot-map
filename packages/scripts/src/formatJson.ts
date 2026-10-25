import fs from "node:fs/promises";
import { Biome, type Configuration } from "@biomejs/js-api/nodejs";

// Biome's CLI skips .geojson files, so we format them with Biome's JSON
// formatter directly. Keep @biomejs/wasm-nodejs on the same version as
// @biomejs/biome so the output matches `pnpm fmt`.

interface BiomeProject {
  instance: Biome;
  projectKey: ReturnType<Biome["openProject"]>["projectKey"];
}

let biome: BiomeProject | undefined;

async function getBiome(): Promise<BiomeProject> {
  if (!biome) {
    const config = JSON.parse(
      await fs.readFile(
        new URL("../../../biome.json", import.meta.url),
        "utf8",
      ),
    ) as Configuration;
    const instance = new Biome();
    const { projectKey } = instance.openProject();
    instance.applyConfiguration(projectKey, config);
    biome = { instance, projectKey };
  }
  return biome;
}

export async function formatJson(content: string): Promise<string> {
  const { instance, projectKey } = await getBiome();
  const { content: formatted, diagnostics } = instance.formatContent(
    projectKey,
    content,
    { filePath: "file.json" },
  );
  if (diagnostics.length > 0) {
    throw new Error(
      `Biome could not format JSON: ${diagnostics.map((d) => d.description).join("; ")}`,
    );
  }
  return formatted;
}

export async function writeJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  await fs.writeFile(filePath, await formatJson(JSON.stringify(data)));
}
