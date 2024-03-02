import fs from "fs/promises";
import {
  Ok,
  Err,
  OrError,
  determineArgs,
  updateCoordinates,
  updateParkingLots,
  valueOrExit,
  exitOnError,
} from "./base";
import { CityId } from "../src/js/types";

const addScoreCard: (
  cityId: CityId,
  cityName: string
) => Promise<OrError<undefined>> = async (cityId, cityName) => {
  const newEntry = {
    Name: cityName,
    Percentage: "FILL ME IN, e.g. 23%",
    cityType: "FILL ME IN, e.g. Core City",
    Population: "FILL ME IN, e.g. 346,824",
    urbanizedAreaPopulation: "FILL ME IN, e.g. 13,200,998",
    "Parking Score": "FILL ME IN, e.g. 53",
    Reforms: "FILL ME IN, e.g. No Reforms or Implemented",
    "Website URL": "FILL ME IN OR DELETE ME",
  };

  const originalFilePath = "data/score-cards.json";
  let originalData: Record<string, Record<string, string>>;
  try {
    const rawOriginalData = await fs.readFile(originalFilePath, "utf8");
    originalData = JSON.parse(rawOriginalData);
  } catch (err: unknown) {
    const { message } = err as Error;
    return Err(
      `Issue reading the score card file path ${originalFilePath}: ${message}`
    );
  }

  originalData[cityId] = newEntry;

  const sortedKeys = Object.keys(originalData).sort();
  const sortedData: Record<string, Record<string, string>> = {};
  sortedKeys.forEach((key) => {
    sortedData[key] = originalData[key];
  });

  await fs.writeFile(originalFilePath, JSON.stringify(sortedData, null, 2));
  return Ok();
};

const main = async () => {
  const args = determineArgs("add-city", process.argv.slice(2));
  const { cityName, cityId } = valueOrExit(
    args,
    (msg) => `Argument error: ${msg}`
  );

  const boundariesResult = await updateCoordinates(
    "add-city",
    cityId,
    true,
    "data/city-boundaries.geojson",
    "city-update.geojson"
  );
  exitOnError(boundariesResult, (msg) => `Error: ${msg}`);

  const lotsResult = await updateParkingLots(
    cityId,
    true,
    "parking-lots-update.geojson",
    `data/parking-lots/${cityId}.geojson`
  );
  exitOnError(lotsResult, (msg) => `Error ${msg}`);

  const scoreCardResult = await addScoreCard(cityId, cityName);
  exitOnError(scoreCardResult, (msg) => `Error ${msg}`);
  /* eslint-disable-next-line no-console */
  console.log(
    `Almost done! Now, fill in the score card values in data/score-cards.json. Then,
    run 'npm run fmt'. Then, 'npm start' and see if the site is what you expect.
    `
  );
};

main();
