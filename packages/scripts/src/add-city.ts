import fs from "fs/promises";

import type { CityId } from "@prn-parking-lots/shared/src/js/model/types.ts";
import { determineArgs, updateCoordinates, updateParkingLots } from "./base.ts";

async function addScoreCard(cityId: CityId, cityName: string): Promise<void> {
  const newEntry = {
    name: cityName,
    percentage: "FILL ME IN, e.g. 23%",
    cityType: "FILL ME IN, e.g. Core City",
    population: "FILL ME IN, e.g. 346,824",
    urbanizedAreaPopulation: "FILL ME IN, e.g. 13,200,998",
    parkingScore:
      "FILL ME IN, e.g. 53. If not relevant, remove the quotes and set to null",
    reforms:
      'FILL ME IN, with "repealed", "adopted", or "proposed". If none apply, remove the quotes and set to null',
    url: "FILL ME IN. If not relevant, remove the quotes and set to null",
    contribution:
      "FILL ME IN with the email of the contributor. If it's an official map, remove the quotes and set to null",
  };

  const originalFilePath = "packages/primary/data/city-stats.json";
  let originalData: Record<string, Record<string, string>>;
  try {
    const rawOriginalData = await fs.readFile(originalFilePath, "utf8");
    originalData = JSON.parse(rawOriginalData);
  } catch (err: unknown) {
    const { message } = err as Error;
    throw new Error(
      `Issue reading the score card file path ${originalFilePath}: ${message}`,
    );
  }

  originalData[cityId] = newEntry;

  const sortedKeys = Object.keys(originalData).sort();
  const sortedData: Record<string, Record<string, string>> = {};
  sortedKeys.forEach((key) => {
    sortedData[key] = originalData[key];
  });

  await fs.writeFile(originalFilePath, JSON.stringify(sortedData, null, 2));
}

async function main() {
  const { cityName, cityId } = determineArgs("add-city", process.argv.slice(2));

  await updateCoordinates(
    "add-city",
    cityId,
    true,
    "packages/primary/data/city-boundaries.geojson",
    "city-update.geojson",
  );

  await updateParkingLots(
    cityId,
    true,
    "parking-lots-update.geojson",
    `packages/primary/data/parking-lots/${cityId}.geojson`,
  );

  await addScoreCard(cityId, cityName);

  console.log(
    `Almost done! Now, fill in the score card values in packages/primary/data/city-stats.json. Then,
    run 'pnpm fmt'. Then, start the server and see if the site is what you expect.
    `,
  );
}

main();
