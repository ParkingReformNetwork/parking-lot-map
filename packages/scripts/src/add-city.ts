import fs from "fs/promises";

import results from "ts-results";

import { CityId } from "@prn-parking-lots/primary/src/js/types.ts";
import { determineArgs, updateCoordinates, updateParkingLots } from "./base.ts";

const addScoreCard = async (
  cityId: CityId,
  cityName: string,
): Promise<results.Result<void, string>> => {
  const newEntry = {
    name: cityName,
    percentage: "FILL ME IN, e.g. 23%",
    cityType: "FILL ME IN, e.g. Core City",
    population: "FILL ME IN, e.g. 346,824",
    urbanizedAreaPopulation: "FILL ME IN, e.g. 13,200,998",
    parkingScore:
      "FILL ME IN, e.g. 53. If not relevant, remove the quotes and set to null",
    reforms: "FILL ME IN, e.g. No Reforms or Implemented",
    url: "FILL ME IN. If not relevant, remove the quotes and set to null",
  };

  const originalFilePath = "data/city-stats.json";
  let originalData: Record<string, Record<string, string>>;
  try {
    const rawOriginalData = await fs.readFile(originalFilePath, "utf8");
    originalData = JSON.parse(rawOriginalData);
  } catch (err: unknown) {
    const { message } = err as Error;
    return results.Err(
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
  return results.Ok.EMPTY;
};

const main = async () => {
  const { cityName, cityId } = determineArgs("add-city", process.argv.slice(2))
    .mapErr((err) => new Error(`Argument error: ${err}`))
    .unwrap();

  (
    await updateCoordinates(
      "add-city",
      cityId,
      true,
      "data/city-boundaries.geojson",
      "city-update.geojson",
    )
  ).unwrap();

  (
    await updateParkingLots(
      cityId,
      true,
      "parking-lots-update.geojson",
      `data/parking-lots/${cityId}.geojson`,
    )
  ).unwrap();

  (await addScoreCard(cityId, cityName)).unwrap();

  /* eslint-disable-next-line no-console */
  console.log(
    `Almost done! Now, fill in the score card values in data/city-stats.json. Then,
    run 'npm run fmt'. Then, 'npm start' and see if the site is what you expect.
    `,
  );
};

main();
