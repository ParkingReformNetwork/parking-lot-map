/* eslint-disable no-console */
import fs from "fs/promises";
import { Ok, Err, determineArgs, updateCoordinates } from "./base.js";

const addScoreCard = async (cityId, cityName) => {
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
  let originalData;
  try {
    const rawOriginalData = await fs.readFile(originalFilePath, "utf8");
    originalData = JSON.parse(rawOriginalData);
  } catch (err) {
    return Err(
      `Issue reading the score card file path ${originalFilePath}: ${err.message}`
    );
  }

  originalData[cityId] = newEntry;

  const sortedKeys = Object.keys(originalData).sort();
  const sortedData = {};
  sortedKeys.forEach((key) => {
    sortedData[key] = originalData[key];
  });

  await fs.writeFile(originalFilePath, JSON.stringify(sortedData, null, 2));
  return Ok();
};

const main = async () => {
  const args = determineArgs("add-city", process.argv.slice(2));
  if (args.error) {
    console.error("Argument error:", args.error);
    process.exit(1);
  }
  const { cityName, cityId } = args.value;

  const boundariesResult = await updateCoordinates(
    "add-city",
    cityId,
    true,
    "data/city-boundaries.geojson",
    "city-update.geojson"
  );
  if (boundariesResult.error) {
    console.error("Error:", boundariesResult.error);
    process.exit(1);
  }

  const lotsResult = await updateCoordinates(
    "add-city",
    cityId,
    true,
    "data/parking-lots.geojson",
    "parking-lots-update.geojson"
  );
  if (lotsResult.error) {
    console.error("Error:", lotsResult.error);
    process.exit(1);
  }

  const scoreCardResult = await addScoreCard(cityId, cityName);
  if (scoreCardResult.error) {
    console.error("Error:", scoreCardResult.error);
    process.exit(1);
  }
  console.log(
    `Almost done! Now, fill in the score card values in data/score-cards.json. Then,
    run 'npm run fmt'. Then, 'npm start' and see if the site is what you expect.
    `
  );
};

main();
