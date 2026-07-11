import fs from "node:fs/promises";
import type { CityStats as CtCityStats } from "@prn-parking-lots/ct/src/js/types.ts";
import type { CityStats as PrimaryCityStats } from "@prn-parking-lots/primary/src/js/types.ts";
import type {
  BaseCityStats,
  CityId,
} from "@prn-parking-lots/shared/src/js/model/types.ts";
import {
  compareIds,
  determineArgs,
  type Pkg,
  readJson,
  updateCoordinates,
  updateParkingLots,
} from "./base.ts";
import { runScript } from "./runScript.ts";

function buildPrimaryEntry(cityName: string): PrimaryCityStats {
  return {
    name: cityName,
    percentage: "FILL ME IN, e.g. 23%",
    population: "FILL ME IN, e.g. 346,824",
    reforms:
      'FILL ME IN, with "repealed", "adopted", or "proposed". If none apply, remove the quotes and set to null',
    url: "FILL ME IN. If not relevant, remove the quotes and set to null",
    cityType: "FILL ME IN, e.g. Core City",
    urbanizedAreaPopulation: "FILL ME IN, e.g. 13,200,998",
    parkingScore:
      "FILL ME IN, e.g. 53. If not relevant, remove the quotes and set to null",
    contribution:
      "FILL ME IN with the email of the contributor. If it's an official map, remove the quotes and set to null",
  };
}

function buildCtEntry(cityName: string): CtCityStats {
  return {
    name: cityName,
    percentage: "FILL ME IN, e.g. 23%",
    population: "FILL ME IN, e.g. 346,824",
    transitStation:
      "FILL ME IN with the transit station name. If none, remove the quotes and set to null",
    county: "FILL ME IN, e.g. Hartford County",
  };
}

async function addScoreCard<T extends BaseCityStats>(
  pkg: Pkg,
  cityId: CityId,
  newEntry: T,
): Promise<void> {
  const filePath = `packages/${pkg}/data/city-stats.json`;
  const originalData = await readJson<Record<string, T>>(
    filePath,
    "score card",
  );

  originalData[cityId] = newEntry;

  const sortedData: Record<string, T> = {};
  for (const key of Object.keys(originalData).sort(compareIds)) {
    sortedData[key] = originalData[key];
  }

  await fs.writeFile(filePath, JSON.stringify(sortedData, null, 2));
}

async function main(): Promise<void> {
  const { pkg, cityName, cityId } = determineArgs(
    "add-city",
    process.argv.slice(2),
  );

  await updateCoordinates(
    "add-city",
    cityId,
    true,
    `packages/${pkg}/data/city-boundaries.geojson`,
    "city-update.geojson",
  );

  await updateParkingLots(
    cityId,
    true,
    "parking-lots-update.geojson",
    `packages/${pkg}/data/parking-lots/${cityId}.geojson`,
  );

  if (pkg === "ct") {
    await addScoreCard(pkg, cityId, buildCtEntry(cityName));
  } else {
    await addScoreCard(pkg, cityId, buildPrimaryEntry(cityName));
  }

  console.log(
    `Almost done! Now, fill in the score card values in packages/${pkg}/data/city-stats.json. ` +
      `Then, run 'pnpm fmt'. Then, start the server with 'pnpm -F ${pkg} start' to see if ` +
      "the site is what you expect.",
  );
}

runScript(main);
