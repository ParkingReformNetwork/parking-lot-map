import fs from "fs/promises";

import type { CityId } from "@prn-parking-lots/shared/src/js/model/types.ts";
import {
  determineArgs,
  Pkg,
  updateCoordinates,
  updateParkingLots,
} from "./base.ts";

async function addScoreCard(
  pkg: Pkg,
  cityId: CityId,
  cityName: string,
): Promise<void> {
  const common = {
    name: cityName,
    percentage: "FILL ME IN, e.g. 23%",
    population: "FILL ME IN, e.g. 346,824",
    reforms:
      'FILL ME IN, with "repealed", "adopted", or "proposed". If none apply, remove the quotes and set to null',
    url: "FILL ME IN. If not relevant, remove the quotes and set to null",
  };
  let newEntry;
  if (pkg === "ct") {
    newEntry = {
      ...common,
      group: "FILL ME IN, either 'Group 1', 'Group 2', or 'Group 3'",
    };
  } else {
    newEntry = {
      ...common,
      cityType: "FILL ME IN, e.g. Core City",
      urbanizedAreaPopulation: "FILL ME IN, e.g. 13,200,998",
      parkingScore:
        "FILL ME IN, e.g. 53. If not relevant, remove the quotes and set to null",
      contribution:
        "FILL ME IN with the email of the contributor. If it's an official map, remove the quotes and set to null",
    };
  }

  const filePath = `packages/${pkg}/data/city-stats.json`;
  let originalData: Record<string, Record<string, string>>;
  try {
    const rawOriginalData = await fs.readFile(filePath, "utf8");
    originalData = JSON.parse(rawOriginalData);
  } catch (err: unknown) {
    const { message } = err as Error;
    throw new Error(
      `Issue reading the score card file path ${filePath}: ${message}`,
    );
  }

  originalData[cityId] = newEntry;

  const sortedKeys = Object.keys(originalData).sort();
  const sortedData: Record<string, Record<string, string>> = {};
  sortedKeys.forEach((key) => {
    sortedData[key] = originalData[key];
  });

  await fs.writeFile(filePath, JSON.stringify(sortedData, null, 2));
}

async function main() {
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

  await addScoreCard(pkg, cityId, cityName);

  console.log(
    `Almost done! Now, fill in the score card values in packages/${pkg}/data/city-stats.json. ` +
      `Then, run 'pnpm fmt'. Then, start the server with 'pnpm -F ${pkg} start' to see if ` +
      "the site is what you expect.",
  );
}

main();
