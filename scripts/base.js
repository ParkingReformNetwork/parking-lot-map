import fs from "fs/promises";
import { parseCityIdFromJson } from "../src/js/cityId.js";

// Rather than using `try/catch`, we return either `Ok` or `Err`.
// This emulates Rust's `Result` type.
const Ok = (value) => ({ value });
const Err = (error) => ({ error });

/**
 * Determine the city name, city ID, and if `--add` was set.
 *
 * @param string scriptCommand - i.e. `update-lots` or `update-city-boundaries`.
 * @param list[string] processArgv - all argv after the first two elements.
 * @return either an `error` or `value` object.
 */
const determineArgs = (scriptCommand, processArgv) => {
  let cityName;
  let addFlag = false;
  for (let i = 0; i < processArgv.length; i += 1) {
    if (processArgv[i] === "--add") {
      addFlag = true;
    } else if (!cityName) {
      cityName = processArgv[i];
    } else {
      return Err(`Unexpected arguments: ${processArgv}`);
    }
  }

  if (!cityName) {
    return Err(
      `Please provide a city/state name, e.g. npm run ${scriptCommand} -- 'Columbus, OH'`
    );
  }

  const cityId = parseCityIdFromJson(cityName);
  return Ok({ cityName, cityId, addFlag });
};

/**
 * Rewrite the coordinates for `cityId`.
 *
 * @param string scriptCommand - i.e. `update-lots` or `update-city-boundaries`.
 * @param string cityId - e.g. 'my-city-az'
 * @param boolean addCity - what to do if the city is missing
 * @param object additionalPropertiesForNewCity - any additional keys and filler values to add
      to Properties when creating a new city.
 * @param string originalFilePath - what will be updated
 * @param string updatedFilePath - where to get the new coordinates
 * @return either an `error` or `value` object. The `value` does not include follow up
      instructions, which you should log.
 */
const updateCoordinates = async (
  scriptCommand,
  cityId,
  addCity,
  additionalPropertiesForNewCity,
  originalFilePath,
  updateFilePath
) => {
  let newData;
  try {
    const rawNewData = await fs.readFile(updateFilePath, "utf8");
    newData = JSON.parse(rawNewData);
  } catch (err) {
    return Err(
      `Issue reading the update file path ${updateFilePath}: ${err.message}`
    );
  }

  if (!Array.isArray(newData.features) || newData.features.length !== 1) {
    return Err(
      "The script expects exactly one entry in `features` because you can only update one city at a time."
    );
  }

  const newCoordinates = newData.features[0].geometry.coordinates;
  const newGeometryType = newData.features[0].geometry.type;

  let originalData;
  try {
    const rawOriginalData = await fs.readFile(originalFilePath, "utf8");
    originalData = JSON.parse(rawOriginalData);
  } catch (err) {
    return Err(
      `Issue reading the original data file path ${originalFilePath}: ${err.message}`
    );
  }

  if (addCity) {
    const newEntry = {
      type: "Feature",
      properties: { id: cityId, ...additionalPropertiesForNewCity },
      geometry: { type: newGeometryType, coordinates: newCoordinates },
    };
    originalData.features.push(newEntry);
  } else {
    const cityOriginalData = originalData.features.find(
      (feature) => feature.properties.id === cityId
    );
    if (!cityOriginalData) {
      return Err(
        `City not found in ${originalFilePath}. To add a new city, run again with the '--add' flag, e.g. npm run ${scriptCommand} -- 'My City, AZ' --add`
      );
    }
    cityOriginalData.geometry.coordinates = newCoordinates;
  }

  // Make sure the data is still sorted.
  originalData.features.sort((a, b) => {
    if (a.properties.id < b.properties.id) {
      return -1;
    }
    if (a.properties.id > b.properties.id) {
      return 1;
    }
    return 0;
  });

  await fs.writeFile(originalFilePath, JSON.stringify(originalData, null, 2));
  return Ok("File updated successfully!");
};

export { Ok, Err, determineArgs, updateCoordinates };
